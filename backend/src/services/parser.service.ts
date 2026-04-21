import * as cheerio from "cheerio";

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
}

const EMAIL_REGEX =
  /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;

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
  // Consider partial if body is tiny OR description is suspiciously short
  // (catches job boards that return 403 with minimal HTML)
  if (bodyText.length < 200) return true;
  if (!description || description.trim().split(/\s+/).length < 80) return true;
  return false;
}

async function getDomainAgeDays(hostname: string): Promise<number | null> {
  try {
    const whoisData = await whoiser(hostname, { timeout: 4000 });
    const firstResult = Object.values(whoisData)[0];
    if (!firstResult) return null;

    const raw =
      firstResult["Created Date"] ??
      firstResult["creation date"] ??
      firstResult["Registration Time"] ??
      firstResult["created"] ??
      null;

    if (!raw) return null;

    const dateStr = Array.isArray(raw) ? String(raw[0]) : String(raw);
    const created = new Date(dateStr);
    if (isNaN(created.getTime())) return null;

    return Math.floor((Date.now() - created.getTime()) / 86_400_000);
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
  };
}