import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

export function domainAgeSignal(data: ParsedJobPage): Signal {
  const domainAgeDays = data.domainAgeDays;

  if (domainAgeDays === null) {
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "medium",
      value: "Unknown",
      confidence: 40,
      icon: "clock",
      explanation:
        "The domain age could not be determined. This may indicate an obscure or recently registered domain.",
      whyItMatters:
        "Established companies typically have domains that have been registered for years. An unknown domain age can signal a new or hidden entity.",
      advice: [
        "Search the company name independently to verify its history.",
        "Check if the company has a LinkedIn or Crunchbase profile with a founding date.",
      ],
    };
  }

  if (domainAgeDays < 90) {
    const months = Math.round(domainAgeDays / 30);
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "high",
      value: `Registered ${months} month${months !== 1 ? "s" : ""} ago`,
      confidence: 72,
      icon: "clock",
      explanation:
        "The company's website domain was registered recently, which may indicate a newly created front.",
      whyItMatters:
        "Scam operations frequently register new domains days or weeks before launching fake job postings. A very recent domain is a strong warning signal.",
      advice: [
        "Search for the company name on LinkedIn and Glassdoor.",
        "Look for independent news or press coverage of this company.",
        "Avoid providing personal information until you can verify the company is legitimate.",
      ],
      example:
        "Scam postings frequently use domains registered days or weeks before the posting.",
    };
  }

  if (domainAgeDays < 365) {
    return {
      id: "domain_age",
      category: "domain_company",
      title: "Domain Age",
      riskLevel: "medium",
      value: `Registered ${Math.round(domainAgeDays / 30)} months ago`,
      confidence: 60,
      icon: "clock",
      explanation:
        "The domain is less than a year old. This could be a new but legitimate company.",
      whyItMatters:
        "While not definitive, domains under a year old carry more risk than established ones. New legitimate startups do exist, but extra verification is wise.",
      advice: [
        "Verify the company exists through independent sources.",
        "Check LinkedIn for company presence and employee profiles.",
      ],
    };
  }

  const years = Math.round(domainAgeDays / 365);
  return {
    id: "domain_age",
    category: "domain_company",
    title: "Domain Age",
    riskLevel: "low",
    value: `Registered ${years} year${years !== 1 ? "s" : ""} ago`,
    confidence: 80,
    icon: "clock",
    explanation:
      "The domain has been registered for over a year, suggesting an established company.",
    whyItMatters:
      "Long-standing domains are harder and more costly to fake. An older domain is a meaningful positive credibility signal.",
    advice: [
      "Continue standard verification steps before sharing personal data.",
    ],
  };
}