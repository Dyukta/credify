import axios from "axios";
import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";
import { isKnownJobBoard } from "../utils/knownDomains";

const REQUEST_TIMEOUT_MS = 5000;

async function checkWebPresence(domain: string): Promise<{ resolves: boolean; isJobBoard: boolean; statusCode: number | null }> {
  const jobBoard = isKnownJobBoard(domain);
  try {
    const response = await axios.head(`https://${domain}`, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: 3,
      validateStatus: () => true,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Credify/1.0; +https://credify.app/bot)" },
    });
    return { resolves: true, isJobBoard: jobBoard, statusCode: response.status };
  } catch {
    return { resolves: false, isJobBoard: jobBoard, statusCode: null };
  }
}

export async function companyRegistrationSignal(data: ParsedJobPage): Promise<Signal> {
  const domain = data.companyDomain;

  if (!domain) {
    return {
      id: "company_registration",
      category: "domain_company",
      title: "Company Web Presence",
      riskLevel: "medium",
      value: "No domain found",
      confidence: 40,
      icon: "building",
      explanation: "No company domain was detected in this posting. Web presence could not be verified.",
      whyItMatters: "Every legitimate company has a website. A posting with no traceable company domain makes independent verification impossible.",
      advice: [
        "Search the company name on Google and verify their official website.",
        "Check for a LinkedIn company page with real employees.",
        "Do not proceed without confirming the company exists independently.",
      ],
    };
  }

  const presence = await checkWebPresence(domain);

  if (presence.isJobBoard) {
    return {
      id: "company_registration",
      category: "domain_company",
      title: "Company Web Presence",
      riskLevel: "medium",
      value: "Posted via job board",
      confidence: 50,
      icon: "building",
      explanation: "This posting is hosted on a job board. The company's own website could not be directly verified.",
      whyItMatters: "Job boards allow anyone to post a listing. Independently verifying the hiring company's website adds an important layer of credibility.",
      advice: [
        "Search the company name directly on Google to find their official website.",
        "Verify the company on LinkedIn — look for an active company page with real employees.",
        "Check for the role on the company's own careers page.",
        "Look up the company on MCA (mca.gov.in) for Indian companies.",
      ],
    };
  }

  if (!presence.resolves) {
    return {
      id: "company_registration",
      category: "red_flags",
      title: "Company Website Unreachable",
      riskLevel: "high",
      value: `${domain} did not respond`,
      confidence: 78,
      icon: "building",
      explanation: `The company domain "${domain}" could not be reached. The website may not exist or may be offline.`,
      whyItMatters: "A company that cannot maintain a working website is unlikely to be a legitimate employer.",
      advice: [
        "Search for the company name on LinkedIn to verify it exists independently.",
        "If the company claims to be established, a non-working website is a serious warning sign.",
        "Do not share personal documents with a company whose website is unreachable.",
        "For Indian companies, verify on MCA portal: https://www.mca.gov.in",
      ],
      example: "Scam operations often register a domain but never build a working website.",
    };
  }

  if (presence.statusCode !== null && presence.statusCode >= 400) {
    return {
      id: "company_registration",
      category: "red_flags",
      title: "Company Website Issue",
      riskLevel: "medium",
      value: `${domain} returned ${presence.statusCode}`,
      confidence: 65,
      icon: "building",
      explanation: `The company website at "${domain}" responded with an error (HTTP ${presence.statusCode}).`,
      whyItMatters: "A company website returning errors warrants additional verification before trusting the posting.",
      advice: [
        "Try visiting the website directly in your browser.",
        "Search for the company on LinkedIn and Glassdoor.",
        "Look for recent news or press coverage of this company.",
      ],
    };
  }

  return {
    id: "company_registration",
    category: "positive",
    title: "Company Website Verified",
    riskLevel: "low",
    value: `${domain} is live`,
    confidence: 80,
    icon: "building",
    explanation: `The company website at "${domain}" is active and reachable — a positive credibility signal.`,
    whyItMatters: "An active, reachable company website confirms the organization has a real web presence.",
    advice: [
      "Verify the website looks professional and matches what the job posting claims.",
      "Check the company's LinkedIn page for employee count and history.",
      "Still perform standard due diligence before sharing sensitive personal information.",
    ],
  };
}