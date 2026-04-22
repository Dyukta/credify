import * as cheerio from "cheerio";
import {
  getCachedDomain,
  isWhoisStale,
  upsertDomainCache,
} from "../db/domainCacheRepo";


const whoiser = require("whoiser") as (
  host: string,
  opts: { timeout: number }
) => Promise<Record<string, Record<string, unknown>>>;

export interface ParsedJobPage {
  jobTitle: string | null;
  jobDescription: string | null;
  contactEmail: string | null;
  companyDomain: string | null;
  companyName: string | null;
  hasSalaryMention: boolean;
  postingDate: string | null;
  domainAgeDays: number | null;
  isPartialData: boolean;
  rawContactMentions: string | null; // ← new: WhatsApp/Telegram/apply-via mentions
}

const EMAIL_REGEX = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;

// Catches WhatsApp links, Telegram handles, Google Form links, phone numbers,
// "apply via" instructions — fed to Gemini for communication_channel signal
const CONTACT_HINT_PATTERNS = [
  /whatsapp[^\s]{0,40}/gi,
  /wa\.me\/[^\s]{0,30}/gi,
  /t\.me\/[^\s]{0,30}/gi,
  /telegram[^\s]{0,40}/gi,
  /google\.com\/forms[^\s]{0,60}/gi,
  /apply\s+(?:via|through|on|at)\s+[^\s.]{1,30}/gi,
  /(?:call|contact|reach|dm)\s+(?:us|hr|recruiter)[^\s.]{0,30}/gi,
  /\+?[0-9]{10,13}/g,
];

const SALARY_PATTERNS = [
  /\$[\d,]+(\s*(–|-|to)\s*\$[\d,]+)?(\s*\/\s*(hour|hr|year|yr|month|annum))?/i,
  /\b(salary|compensation|pay|stipend|wage|ctc|lpa|lakh)\b/i,
  /\b\d{2,3}[kK]\s*(–|-|to)\s*\d{2,3}[kK]\b/,
  /₹[\d,]+(\s*(–|-|to)\s*₹[\d,]+)?/,
  /\b\d+(\.\d+)?\s*(LPA|lpa|L\/year|lac)/,
];

const DATE_SELECTORS = [
  'time[datetime]',
  'meta[property="article:published_time"]',
  'meta[name="date"]',
  'meta[property="og:updated_time"]',
  '[class*="date"]',
  '[class*="posted"]',
];

const TITLE_SELECTORS = [
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  'h1',
  '[class*="job-title"]',
  '[class*="jobtitle"]',
  '[class*="position-title"]',
  'title',
];

const DESCRIPTION_SELECTORS = [
  'meta[property="og:description"]',
  'meta[name="twitter:description"]',
  'meta[name="description"]',
  '[class*="job-description"]',
  '[class*="jobdescription"]',
  '[class*="description"]',
  '[class*="posting-body"]',
  'article',
  'main',
];

const TITLE_SUFFIX_PATTERNS = [
  /\s*[\|–\-]\s*(LinkedIn|Indeed|Naukri|Glassdoor|Monster|Wellfound|Internshala|Foundit|Shine|Unstop).*$/i,
  /\s*[\|–\-]\s*Jobs?\s*$/i,
  /\s*[\|–\-]\s*Careers?\s*$/i,
  /^Check out this job at .+?,\s*/i,
  /\s*[\|–\-]\s*Apply.*$/i,
];

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function cleanJobTitle(title: string): string {
  let cleaned = title;
  for (const pattern of TITLE_SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, "").trim();
  }
  return cleaned;
}

function extractEmail(html: string): string | null {
  const matches = html.match(EMAIL_REGEX);
  if (!matches) return null;
  const filtered = matches.filter((e) => !/\.(png|jpg|svg)$/i.test(e));
  return filtered[0] ?? null;
}

function extractSalaryMention(text: string): boolean {
  return SALARY_PATTERNS.some((pattern) => pattern.test(text));
}

// New — extracts contact channel hints for Gemini
function extractContactMentions(text: string): string | null {
  const hits: string[] = [];
  for (const pattern of CONTACT_HINT_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) hits.push(...matches);
  }
  if (hits.length === 0) return null;
  // Deduplicate and cap length so we don't bloat the prompt
  return [...new Set(hits)].slice(0, 10).join(" | ").slice(0, 400);
}

function extractPostingDate($: cheerio.CheerioAPI): string | null {
  for (const selector of DATE_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    const value = el.attr("datetime") ?? el.attr("content") ?? el.text();
    if (value?.trim()) return value.trim();
  }
  return null;
}

function extractJobTitle($: cheerio.CheerioAPI): string | null {
  for (const selector of TITLE_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    const raw = normalize(el.attr("content") ?? el.text());
    const text = cleanJobTitle(raw);
    if (text.length > 2 && text.length < 300) return text;
  }
  return null;
}

function extractDescription($: cheerio.CheerioAPI): string | null {
  for (const selector of DESCRIPTION_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    const text = normalize(el.attr("content") ?? el.text());
    if (text.length > 30) return text.slice(0, 5000);
  }
  const bodyText = normalize($("body").text());
  return bodyText.length ? bodyText.slice(0, 5000) : null;
}

function extractCompanyDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function extractCompanyName($: cheerio.CheerioAPI): string | null {
  const ogSite = $('meta[property="og:site_name"]').attr("content");
  if (ogSite?.trim()) return ogSite.trim();
  try {
    const ldJson = $('script[type="application/ld+json"]').first().html();
    if (ldJson) {
      const parsed = JSON.parse(ldJson);
      const employer =
        parsed?.hiringOrganization?.name ??
        parsed?.author?.name ??
        parsed?.publisher?.name;
      if (employer) return String(employer).trim();
    }
  } catch {}
  return null;
}

function detectPartialData(
  $: cheerio.CheerioAPI,
  description: string | null
): boolean {
  const bodyText = normalize($("body").text());
  if (bodyText.length < 200) return true;
  if (!description || description.trim().split(/\s+/).length < 80) return true;
  return false;
}

async function getDomainAgeDays(hostname: string): Promise<number | null> {
  const cached = getCachedDomain(hostname);
  if (cached && !isWhoisStale(cached)) {
    return cached.domainAgeDays;
  }

  try {
    const whoisData = await whoiser(hostname, { timeout: 4000 });
    const firstResult = Object.values(whoisData)[0];
    if (!firstResult) {
      upsertDomainCache(hostname, {
        domainAgeDays: null,
        whoisLastChecked: new Date().toISOString(),
      });
      return null;
    }

    const raw =
      firstResult["Created Date"] ??
      firstResult["creation date"] ??
      firstResult["Registration Time"] ??
      firstResult["created"] ??
      null;

    if (!raw) {
      upsertDomainCache(hostname, {
        domainAgeDays: null,
        whoisLastChecked: new Date().toISOString(),
      });
      return null;
    }

    const dateStr = Array.isArray(raw) ? String(raw[0]) : String(raw);
    const created = new Date(dateStr);
    if (isNaN(created.getTime())) return null;

    const ageDays = Math.floor((Date.now() - created.getTime()) / 86_400_000);

    upsertDomainCache(hostname, {
      domainAgeDays: ageDays,
      whoisLastChecked: new Date().toISOString(),
    });

    return ageDays;
  } catch {
    return null;
  }
}

export async function parseJobPage(
  html: string,
  sourceUrl: string
): Promise<ParsedJobPage> {
  const $ = cheerio.load(html);

  $("script[src],style,nav,footer,header,iframe,noscript").remove();
  const companyName = extractCompanyName($);
  $("script").remove();

  const description = extractDescription($);
  const isPartialData = detectPartialData($, description);
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");


  const rawContactMentions = extractContactMentions(
    (description ?? "") + " " + html.slice(0, 10_000)
  );

  return {
    jobTitle: extractJobTitle($),
    jobDescription: description,
    contactEmail: extractEmail(html),
    companyDomain: extractCompanyDomain(sourceUrl),
    companyName,
    hasSalaryMention: extractSalaryMention(description ?? html),
    postingDate: extractPostingDate($),
    domainAgeDays: await getDomainAgeDays(hostname),
    isPartialData,
    rawContactMentions,
  };
}