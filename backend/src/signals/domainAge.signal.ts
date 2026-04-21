import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const ESTABLISHED_DOMAINS = new Set([
  "linkedin.com", "indeed.com", "naukri.com", "wellfound.com",
  "glassdoor.com", "monster.com", "shine.com", "timesjobs.com",
  "foundit.in", "internshala.com", "unstop.com", "google.com",
  "microsoft.com", "amazon.com", "flipkart.com", "infosys.com",
  "tcs.com", "wipro.com", "hcltech.com", "accenture.com",
]);

export function domainAgeSignal(data: ParsedJobPage): Signal {
  const domain = data.companyDomain?.replace(/^www\./, "") ?? null;
  const domainAgeDays = data.domainAgeDays;

  // Known established domains — skip WHOIS, immediately low risk
  if (domain && ESTABLISHED_DOMAINS.has(domain)) {
    return {
      id: "domain_age",
      category: "positive",
      title: "Domain Age",
      riskLevel: "low",
      value: "Established domain",
      confidence: 95,
      icon: "clock",
      explanation:
        `"${domain}" is a well-known established domain with a long verified history.`,
      whyItMatters:
        "Long-standing domains are significantly harder to fake. An established domain is a strong credibility signal.",
      advice: [
        "Continue standard verification steps before sharing personal data.",
      ],
    };
  }

  if (domainAgeDays === null) {
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "medium",
      value: "Could not verify",
      confidence: 35,
      icon: "clock",
      explanation:
        "The domain registration age could not be determined automatically. This may be due to privacy protection on the WHOIS record.",
      whyItMatters:
        "Established companies typically have domains registered for years. When age cannot be verified, manual checks are recommended.",
      advice: [
        "Check the domain on https://whois.domaintools.com to see its registration date.",
        "Search the company name on LinkedIn and Crunchbase for founding date.",
        "A company claiming years of experience but with an unverifiable domain warrants extra scrutiny.",
      ],
    };
  }

  if (domainAgeDays < 90) {
    const months = Math.max(1, Math.round(domainAgeDays / 30));
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "high",
      value: `Registered ${months} month${months !== 1 ? "s" : ""} ago`,
      confidence: 82,
      icon: "clock",
      explanation:
        `The company domain was registered only ${months} month${months !== 1 ? "s" : ""} ago — a strong warning signal for a new or fraudulent operation.`,
      whyItMatters:
        "Scam operations frequently register new domains days or weeks before launching fake job postings. A very recent domain combined with active hiring is a serious red flag.",
      advice: [
        "Search for the company name on LinkedIn — check how long their page has existed.",
        "Look for independent news, press coverage, or Glassdoor reviews.",
        "Avoid providing personal information until you can verify the company has a real history.",
        "Check the domain on https://whois.domaintools.com to confirm registration date.",
      ],
      example:
        "Scam postings frequently use domains registered days or weeks before the posting goes live.",
    };
  }

  if (domainAgeDays < 365) {
    const months = Math.round(domainAgeDays / 30);
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "medium",
      value: `Registered ${months} months ago`,
      confidence: 65,
      icon: "clock",
      explanation:
        `The domain is ${months} months old — less than a year. This could be a new but legitimate startup.`,
      whyItMatters:
        "Domains under a year old carry more risk than established ones. New legitimate startups do exist, but extra verification is wise before sharing personal information.",
      advice: [
        "Verify the company exists through independent sources like LinkedIn or Crunchbase.",
        "Check for employee profiles on LinkedIn who list this company.",
        "A young domain is not automatically suspicious — but verify before proceeding.",
      ],
    };
  }

  const years = Math.round(domainAgeDays / 365);
  return {
    id: "domain_age",
    category: "positive",
    title: "Domain Age",
    riskLevel: "low",
    value: `Registered ${years} year${years !== 1 ? "s" : ""} ago`,
    confidence: 85,
    icon: "clock",
    explanation:
      `The domain has been registered for ${years} year${years !== 1 ? "s" : ""}, indicating an established company with a real online history.`,
    whyItMatters:
      "Long-standing domains are harder and more costly to fake. An older domain is one of the strongest automated credibility signals available.",
    advice: [
      "Continue standard verification steps before sharing personal data.",
    ],
  };
}