import axios from "axios";
import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const SEARCH_TIMEOUT_MS = 5000;

interface ZaubacorpResult {
  company_name: string;
  cin: string;
  status: string;
  date_of_incorporation: string;
  company_category: string;
}

function domainToCompanyName(domain: string): string {
  const cleaned = domain.replace(/^www\./i, "");
  const parts = cleaned.replace(/\.(com|in|io|co|net|org|ai|tech)$/i, "").split(".");
  return parts[parts.length - 1].toLowerCase();
}

async function searchMCA(companyName: string): Promise<ZaubacorpResult | null> {
  try {
    const response = await axios.get<{ data: ZaubacorpResult[] }>(
      `https://www.zaubacorp.com/api/company-search`,
      {
        params: { q: companyName, limit: 1 },
        timeout: SEARCH_TIMEOUT_MS,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Credify/1.0; +https://credify.app/bot)",
          Accept: "application/json",
        },
      }
    );

    const results = response.data?.data;
    if (!Array.isArray(results) || results.length === 0) return null;
    return results[0];
  } catch {
    return null;
  }
}

export async function companyRegistrationSignal(
  data: ParsedJobPage
): Promise<Signal> {
  const domain = data.companyDomain;

  if (!domain) {
    return {
      id: "company_registration",
      category: "domain_company",
      title: "Business Registration",
      riskLevel: "medium",
      value: "No company domain found",
      confidence: 35,
      icon: "building",
      explanation:
        "No company domain was detected in this posting, so MCA registration status could not be checked.",
      whyItMatters:
        "Legitimate companies in India are required to register with the Ministry of Corporate Affairs (MCA). Without a domain, automated verification is not possible.",
      advice: [
        "Search the company name manually on the MCA portal: https://www.mca.gov.in",
        "Look up the company on Zaubacorp (zaubacorp.com) or Tofler (tofler.in).",
        "Ask the recruiter for the company CIN (Corporate Identification Number).",
      ],
    };
  }

  const companyName = domainToCompanyName(domain);
  const result = await searchMCA(companyName);

  if (!result) {
    return {
      id: "company_registration",
      category: "domain_company",
      title: "Business Registration",
      riskLevel: "medium",
      value: "Could not verify via MCA",
      confidence: 40,
      icon: "building",
      explanation:
        `Automated MCA registration lookup for "${companyName}" was unavailable. This does not mean the company is unregistered — manual verification is recommended.`,
      whyItMatters:
        "Verifying MCA registration confirms a company has legal standing in India. Automated checks are a convenience — manual verification on the MCA portal is always authoritative.",
      advice: [
        `Search for "${companyName}" at https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do`,
        "Use Zaubacorp (zaubacorp.com) or Tofler (tofler.in) for free public MCA records.",
        "Ask the recruiter for the CIN number and verify it independently.",
        "Do not share personal documents before confirming registration.",
      ],
    };
  }

  const isActive = result.status?.toLowerCase().includes("active") ?? false;

  if (!isActive) {
    return {
      id: "company_registration",
      category: "domain_company",
      title: "Business Registration",
      riskLevel: "high",
      value: `Status: ${result.status}`,
      confidence: 82,
      icon: "building",
      explanation: `"${result.company_name}" is registered under MCA but its current status is "${result.status}", not Active.`,
      whyItMatters:
        "A struck-off, dissolved, or dormant company cannot legally conduct business or hire employees. Job postings from such entities are a serious red flag.",
      advice: [
        "Do not apply or share information with a company that is not actively registered.",
        `Verify the status directly at the MCA portal using CIN: ${result.cin}`,
        "Contact a legal professional if you have already shared personal documents.",
      ],
      example:
        "Scammers sometimes use the identity of dissolved companies to appear legitimate.",
    };
  }
  
  return {
    id: "company_registration",
    category: "domain_company",
    title: "Business Registration",
    riskLevel: "low",
    value: `CIN: ${result.cin}`,
    confidence: 88,
    icon: "building",
    explanation: `"${result.company_name}" is an Active registered company under MCA. Incorporated: ${result.date_of_incorporation}.`,
    whyItMatters:
      "An active MCA registration means the company has legal standing, is accountable under Indian law, and has met incorporation requirements.",
    advice: [
      "You can verify this CIN at any time on the MCA portal.",
      "Continue standard due diligence before sharing sensitive personal information.",
    ],
  };
}