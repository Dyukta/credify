import axios from "axios";
import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const TIMEOUT_MS = 4000;

const CAREERS_PATHS = [
  "/careers", "/jobs", "/careers/jobs",
  "/about/careers", "/join-us", "/work-with-us",
];

const KNOWN_JOB_BOARDS = new Set([
  "linkedin.com", "indeed.com", "naukri.com", "wellfound.com",
  "glassdoor.com", "monster.com", "shine.com", "timesjobs.com",
  "foundit.in", "internshala.com", "unstop.com", "hirist.com",
  "freshersworld.com", "apna.co", "cutshort.io",
]);

function getRootDomain(domain: string): string {
  const parts = domain.replace(/^www\./, "").split(".");
  if (parts.length > 2) return parts.slice(-2).join(".");
  return domain;
}

function getTitleKeywords(title: string): string[] {
  const stopWords = new Set([
    "and","or","the","a","an","of","in","at","for",
    "to","with","on","is","are","be",
  ]);
  return title
    .toLowerCase()
    .split(/[\s,\-–\/]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

async function fetchCareersPageText(domain: string): Promise<string | null> {
  for (const path of CAREERS_PATHS) {
    try {
      const res = await axios.get<string>(`https://${domain}${path}`, {
        timeout: TIMEOUT_MS,
        maxRedirects: 3,
        validateStatus: (s) => s < 400,
        responseType: "text",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Credify/1.0; +https://credify.app/bot)",
          Accept: "text/html",
        },
      });
      if (res.data && res.data.trim().length > 100) {
        return res.data.toLowerCase().slice(0, 50_000);
      }
    } catch {
      continue;
    }
  }
  return null;
}

export async function crossPlatformVerifySignal(data: ParsedJobPage): Promise<Signal> {
  const rawDomain = data.companyDomain?.replace(/^www\./, "") ?? null;
  const rootDomain = rawDomain ? getRootDomain(rawDomain) : null;

  if (rootDomain && KNOWN_JOB_BOARDS.has(rootDomain)) {
    return {
      id: "cross_platform_verify",
      category: "domain_company",
      title: "Cross-Platform Verification",
      riskLevel: "medium",
      value: "Check careers page manually",
      confidence: 55,
      icon: "search",
      explanation: "This posting is on a job board. Verify the same role appears on the company's own careers page.",
      whyItMatters: "Job boards allow anyone to post. The strongest verification is finding the role on the company's official website.",
      advice: [
        "Search the company name + job title on Google.",
        "Visit the company website directly and look for a careers section.",
        "If the role isn't listed there, contact the company directly to confirm.",
      ],
    };
  }

  if (!rootDomain || !data.jobTitle) {
    return {
      id: "cross_platform_verify",
      category: "domain_company",
      title: "Cross-Platform Verification",
      riskLevel: "medium",
      value: "Could not verify",
      confidence: 30,
      icon: "search",
      explanation: "Company domain or job title could not be determined — cross-platform verification skipped.",
      whyItMatters: "Verifying the role appears on the company's official careers page is one of the strongest legitimacy checks available.",
      advice: [
        "Manually search for the company's careers page and look for this role.",
        "Contact the company directly through their official website to confirm the posting.",
      ],
    };
  }

  const pageText = await fetchCareersPageText(rootDomain);

  if (!pageText) {
    return {
      id: "cross_platform_verify",
      category: "domain_company",
      title: "Cross-Platform Verification",
      riskLevel: "medium",
      value: "Careers page not accessible",
      confidence: 45,
      icon: "search",
      explanation: `Could not access a careers page at ${rootDomain} to verify this role is listed there.`,
      whyItMatters: "If the company has no accessible careers page, the posting cannot be independently verified through official channels.",
      advice: [
        `Search Google for "${rootDomain} careers" or "${rootDomain} jobs".`,
        "Look for the role on the company's LinkedIn page.",
        "Contact the company through their official website to confirm the role exists.",
      ],
    };
  }

  const keywords = getTitleKeywords(data.jobTitle);
  const matchCount = keywords.filter((kw) => pageText.includes(kw)).length;
  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

  if (matchRatio >= 0.5) {
    return {
      id: "cross_platform_verify",
      category: "positive",
      title: "Cross-Platform Verified",
      riskLevel: "low",
      value: "Role found on company careers page",
      confidence: 82,
      icon: "search",
      explanation: `The job title matches content on ${rootDomain}'s careers page — strong evidence this is a real, actively listed role.`,
      whyItMatters: "A role appearing on both a job board and the company's own careers page is the strongest possible legitimacy signal.",
      advice: [
        "Visit the careers page directly to read the official posting.",
        "Apply through the company's official channel where possible.",
      ],
    };
  }

  return {
    id: "cross_platform_verify",
    category: "red_flags",
    title: "Not Found on Careers Page",
    riskLevel: "medium",
    value: `Role not confirmed on ${rootDomain}`,
    confidence: 65,
    icon: "search",
    explanation: `${rootDomain} has a careers page but this role ("${data.jobTitle.slice(0, 50)}") could not be found there. This may be a ghost job or impersonation posting.`,
    whyItMatters: "If a company is actively hiring for a role, it should appear on their own careers page.",
    advice: [
      `Visit ${rootDomain}'s careers page directly to search for this role.`,
      "Message the company's HR through their official website to confirm the opening.",
      "If the role doesn't appear on the company's own site, treat this posting with caution.",
    ],
  };
}