import * as cheerio from 'cheerio'

export interface ParsedJobPage {
  jobTitle: string | null
  jobDescription: string | null
  contactEmail: string | null
  companyDomain: string | null
  hasSalaryMention: boolean
  postingDate: string | null
  domainAgeDays: number | null
}

const EMAIL_REGEX =
  /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g

const SALARY_PATTERNS = [
  /\$[\d,]+(\s*(–|-|to)\s*\$[\d,]+)?(\s*\/\s*(hour|hr|year|yr|month|annum))?/i,
  /\b(salary|compensation|pay|stipend|wage|ctc|lpa|lakh)\b/i,
  /\b\d{2,3}[kK]\s*(–|-|to)\s*\d{2,3}[kK]\b/,
]

const DATE_SELECTORS = [
  'time[datetime]',
  'meta[property="article:published_time"]',
  'meta[name="date"]',
  '[class*="date"]',
  '[class*="posted"]',
]

const TITLE_SELECTORS = [
  'h1',
  '[class*="job-title"]',
  '[class*="jobtitle"]',
  '[class*="position-title"]',
  'title',
]

const DESCRIPTION_SELECTORS = [
  '[class*="job-description"]',
  '[class*="jobdescription"]',
  '[class*="description"]',
  '[class*="posting-body"]',
  'article',
  'main',
]

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function extractEmail(html: string): string | null {
  const matches = html.match(EMAIL_REGEX)
  if (!matches) return null

  const filtered = matches.filter(
    (e) => !/\.(png|jpg|svg)$/i.test(e)
  )

  return filtered[0] ?? null
}

function extractSalaryMention(text: string): boolean {
  return SALARY_PATTERNS.some((pattern) => pattern.test(text))
}

function extractPostingDate($: cheerio.CheerioAPI): string | null {
  for (const selector of DATE_SELECTORS) {
    const el = $(selector).first()
    if (!el.length) continue

    const value =
      el.attr('datetime') ??
      el.attr('content') ??
      el.text()

    if (value?.trim()) return value.trim()
  }

  return null
}

function extractJobTitle($: cheerio.CheerioAPI): string | null {
  for (const selector of TITLE_SELECTORS) {
    const text = normalize($(selector).first().text())
    if (text.length > 2 && text.length < 200) return text
  }

  return null
}

function extractDescription($: cheerio.CheerioAPI): string | null {
  for (const selector of DESCRIPTION_SELECTORS) {
    const text = normalize($(selector).first().text())
    if (text.length > 100) return text.slice(0, 5000)
  }

  const bodyText = normalize($('body').text())

  return bodyText.length ? bodyText.slice(0, 5000) : null
}

function extractCompanyDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function parseJobPage(
  html: string,
  sourceUrl: string
): ParsedJobPage {
  const $ = cheerio.load(html)

  $('script,style,nav,footer,header,iframe,noscript').remove()

  const description = extractDescription($)

  return {
    jobTitle: extractJobTitle($),
    jobDescription: description,
    contactEmail: extractEmail(html),
    companyDomain: extractCompanyDomain(sourceUrl),
    hasSalaryMention: extractSalaryMention(description ?? html),
    postingDate: extractPostingDate($),
    domainAgeDays: null,
  }
}