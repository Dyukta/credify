import axios from "axios";
import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";
import { KNOWN_JOB_BOARDS, getRootDomain } from "../utils/knownDomains";

const TIMEOUT_MS = 4000;
const CAREERS_PATHS = [
  "/careers", "/jobs", "/careers/jobs",
  "/about/careers", "/join-us", "/work-with-us", "/opportunities",
];

async function checkCareersPage(domain: string): Promise<{ found: boolean; url: string | null }> {
  for (const path of CAREERS_PATHS) {
    const url = `https://${domain}${path}`;
    try {
      const res = await axios.head(url, {
        timeout: TIMEOUT_MS,
        maxRedirects: 3,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Credify/1.0; +https://credify.app/bot)" },
      });
      if (res.status < 400) return { found: true, url };
    } catch {
      continue;
    }
  }
  return { found: false, url: null };
}

export async function careersPageSignal(data: ParsedJobPage): Promise<Signal> {
  const domain = data.companyDomain?.replace(/^www\./, "");

  if (!domain) {
    return {
      id: "careers_page",
      category: "domain_company",
      title: "Careers Page",
      riskLevel: "medium",
      value: "No domain to check",
      confidence: 35,
      icon: "briefcase",
      explanation: "No company domain was found so a careers page check could not be performed.",
      whyItMatters: "A company careers page is the strongest verification signal — it confirms the company is actively hiring.",
      advice: [
        "Search the company name + 'careers' on Google to find their official jobs page.",
        "Verify the posting exists on their official site before applying.",
      ],
    };
  }

  if (KNOWN_JOB_BOARDS.has(getRootDomain(domain))) {
    return {
      id: "careers_page",
      category: "positive",
      title: "Careers Page",
      riskLevel: "low",
      value: "Verified job board",
      confidence: 85,
      icon: "briefcase",
      explanation: "This posting is on a verified job board platform that vets company listings.",
      whyItMatters: "Established job boards have verification mechanisms that reduce the likelihood of completely fraudulent postings.",
      advice: ["Still verify the hiring company independently by visiting their official website."],
    };
  }

  const result = await checkCareersPage(domain);

  if (result.found) {
    return {
      id: "careers_page",
      category: "positive",
      title: "Careers Page Found",
      riskLevel: "low",
      value: `${domain} has a careers page`,
      confidence: 85,
      icon: "briefcase",
      explanation: `A careers/jobs page was found at "${result.url}". This strongly suggests the company is actively hiring.`,
      whyItMatters: "A working careers page is the single strongest indicator of legitimate hiring intent. Scammers cannot replicate a real company's careers portal.",
      advice: [
        "Verify this specific job role is listed on their careers page.",
        "If the role is NOT on their careers page despite being listed elsewhere, it may be a ghost job or impersonation.",
      ],
    };
  }

  return {
    id: "careers_page",
    category: "red_flags",
    title: "No Careers Page Found",
    riskLevel: "medium",
    value: `${domain} — no careers page`,
    confidence: 65,
    icon: "briefcase",
    explanation: `No accessible careers or jobs page was found at "${domain}". This makes it impossible to cross-verify the posting.`,
    whyItMatters: "Legitimate companies that are actively hiring almost always maintain a careers page.",
    advice: [
      "Search Google for the company name + 'careers' or 'jobs'.",
      "Check the company's LinkedIn page for active job postings.",
      "If you cannot verify the role on any official company channel, proceed with caution.",
    ],
  };
}