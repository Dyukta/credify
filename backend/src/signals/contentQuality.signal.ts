import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const QUALITY_KEYWORDS = [
  "responsibilities", "qualifications", "requirements", "experience",
  "skills", "duties", "deliverables", "reporting", "team", "benefits",
  "compensation", "location", "remote", "hybrid", "salary",
];

const RED_FLAG_PHRASES = [
  "work from home", "easy money", "no experience needed", "unlimited earning",
  "be your own boss", "financial freedom", "training provided", "immediate start",
  "urgently hiring", "must have paypal", "bitcoin", "wire transfer",
  "upfront fee", "investment required",
];

function scoreCompleteness(description: string): number {
  if (!description || description.trim().length === 0) return 0;
  const lowerDesc = description.toLowerCase();
  const keywordsFound = QUALITY_KEYWORDS.filter((kw) =>
    lowerDesc.includes(kw)
  ).length;
  return Math.round((keywordsFound / QUALITY_KEYWORDS.length) * 100);
}

function findRedFlagPhrases(description: string): string[] {
  const lowerDesc = description.toLowerCase();
  return RED_FLAG_PHRASES.filter((phrase) => lowerDesc.includes(phrase));
}

export function contentQualitySignal(data: ParsedJobPage): Signal {
  const description = data.jobDescription ?? "";
  const completeness = scoreCompleteness(description);
  const redFlags = findRedFlagPhrases(description);
  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;

  if (data.isPartialData && wordCount < 100 && redFlags.length === 0) {
    return {
      id: "content_quality",
      category: "domain_company",
      title: "Limited Description Data",
      riskLevel: "medium",
      value: "Partial data only",
      confidence: 40,
      icon: "document",
      explanation:
        "This platform restricts automated access, so only a summary of the job description was available for analysis.",
      whyItMatters:
        "Without the full job description, red flag phrases and completeness cannot be fully assessed. Review the full listing manually.",
      advice: [
        "Open the job posting directly to read the full description.",
        "Check that the posting includes specific responsibilities, qualifications, and compensation details.",
        "Be cautious if the full description is also vague after reading it manually.",
      ],
    };
  }

  if (redFlags.length > 0) {
    return {
      id: "content_quality",
      category: "red_flags",
      title: "Suspicious Job Description Language",
      riskLevel: "high",
      value: `${redFlags.length} red flag phrase${redFlags.length > 1 ? "s" : ""} detected`,
      confidence: 90,
      icon: "document",
      explanation: `The description contains phrases commonly associated with scam job postings: "${redFlags[0]}".`,
      whyItMatters:
        "Scam postings rely on emotionally charged or vague language to attract victims quickly. Phrases like 'easy money' or 'urgently hiring' are classic manipulation tactics.",
      advice: [
        "Do not pay any upfront fees for training, equipment, or background checks.",
        "Legitimate employers never ask for payment from candidates.",
        "Report suspicious postings to the platform where you found them.",
      ],
      example:
        "Scam postings often use urgency language like 'urgently hiring' or promise unrealistic earnings.",
    };
  }

  if (wordCount < 50 || completeness < 25) {
    return {
      id: "content_quality",
      category: "red_flags",
      title: "Vague Job Description",
      riskLevel: "high",
      value: `Completeness: ${completeness}%`,
      confidence: 92,
      icon: "document",
      explanation:
        "The posting lacks specific responsibilities, qualifications, and deliverables — a common scam pattern.",
      whyItMatters:
        "Fraudulent postings are deliberately vague to cast a wide net and avoid accountability.",
      advice: [
        "Ask the recruiter for a detailed job description before proceeding.",
        "Legitimate companies provide clear role expectations.",
      ],
      example: "Scam postings are often vague to attract as many victims as possible.",
    };
  }

  if (completeness < 50) {
    return {
      id: "content_quality",
      category: "red_flags",
      title: "Incomplete Job Description",
      riskLevel: "medium",
      value: `Completeness: ${completeness}%`,
      confidence: 70,
      icon: "document",
      explanation:
        "The posting is missing several key details that legitimate job descriptions usually include.",
      whyItMatters:
        "Incomplete descriptions can signal a hastily created posting or one designed to gather applicant data without real hiring intent.",
      advice: [
        "Request more details about responsibilities and requirements before applying.",
        "Check if the company has listed the role on LinkedIn or their official careers page.",
      ],
    };
  }

  return {
    id: "content_quality",
    category: "positive",
    title: "Detailed Job Description",
    riskLevel: "low",
    value: `Completeness: ${completeness}%`,
    confidence: 80,
    icon: "document",
    explanation:
      "The posting includes specific responsibilities, qualifications, and role details — a positive credibility signal.",
    whyItMatters:
      "A well-structured job description signals genuine hiring intent.",
    advice: [
      "Continue standard verification before sharing sensitive personal information.",
    ],
  };
}