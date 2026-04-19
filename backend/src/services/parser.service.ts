import * as cheerio from "cheerio";

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

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
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
    const value =
      el.attr("datetime") ?? el.attr("content") ?? el.text();
    if (value?.trim()) return value.trim();
  }
  return null;
}

function extractJobTitle($: cheerio.CheerioAPI): string | null {
  for (const selector of TITLE_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    // meta tags store value in content attribute
    const text = normalize(el.attr("content") ?? el.text());
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
  } catch {

  }

  return null;
}

function detectPartialData($: cheerio.CheerioAPI): boolean {
  const bodyText = normalize($("body").text());
  return bodyText.length < 200;
}

export function parseJobPage(
  html: string,
  sourceUrl: string
): ParsedJobPage {
  const $ = cheerio.load(html);

  $("script[src],style,nav,footer,header,iframe,noscript").remove();
  const companyName = extractCompanyName($);
  $("script").remove();

  const isPartialData = detectPartialData($);
  const description = extractDescription($);

  return {
    jobTitle: extractJobTitle($),
    jobDescription: description,
    contactEmail: extractEmail(html),
    companyDomain: extractCompanyDomain(sourceUrl),
    companyName,
    hasSalaryMention: extractSalaryMention(description ?? html),
    postingDate: extractPostingDate($),
    domainAgeDays: null,
    isPartialData,
  };
}