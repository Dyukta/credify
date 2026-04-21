import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const QUALITY_KEYWORDS = [
  "responsibilities", "qualifications", "requirements", "experience",
  "skills", "duties", "deliverables", "reporting", "team", "benefits",
  "compensation", "location", "remote", "hybrid", "salary",
];

const RED_FLAG_PHRASES = [
  // Classic scam patterns
  "work from home", "easy money", "no experience needed", "unlimited earning",
  "be your own boss", "financial freedom", "training provided", "immediate start",
  "urgently hiring", "must have paypal", "bitcoin", "wire transfer",
  "upfront fee", "investment required",
  "no interview required",
  "work at your own pace",
  "weekly pay guaranteed",
  "dm us to apply",
  "whatsapp to apply",
  "google form",
  "registration fee",
  "processing fee",
  "refundable deposit",
  "earn from home",
  "part time earn",
  "flexible hours earn",
  "no target no pressure",
  "daily payout",
  "refer and earn",
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
        "This platform restricts automated access, so only a partial job description was available for analysis.",
      whyItMatters:
        "Without the full description, red flag phrases and completeness cannot be fully assessed. Review the full listing manually before applying.",
      advice: [
        "Open the job posting directly to read the full description.",
        "Check that it includes specific responsibilities, qualifications, and compensation details.",
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
      explanation: `The description contains ${redFlags.length} phrase${redFlags.length > 1 ? "s" : ""} commonly associated with scam postings: "${redFlags[0]}"${redFlags.length > 1 ? ` and ${redFlags.length - 1} more` : ""}.`,
      whyItMatters:
        "Scam postings rely on emotionally charged or vague language to attract victims quickly. Phrases like 'easy money', 'WhatsApp to apply', or 'registration fee' are direct manipulation and fraud tactics.",
      advice: [
        "Never pay any fee — for training, equipment, registration, or background checks.",
        "Legitimate employers never ask candidates for money.",
        "Never apply through WhatsApp, Google Forms, or DMs — use the official platform.",
        "Report suspicious postings to the platform where you found them.",
      ],
      example:
        "Scam postings use urgency and easy-money language to bypass rational thinking.",
    };
  }

  if (wordCount < 50 || completeness < 25) {
    return {
      id: "content_quality",
      category: "red_flags",
      title: "Vague Job Description",
      riskLevel: "high",
      value: `Completeness: ${completeness}%`,
      confidence: 82,
      icon: "document",
      explanation:
        "The posting lacks specific responsibilities, qualifications, and deliverables — a common pattern in fraudulent postings.",
      whyItMatters:
        "Fraudulent postings are deliberately vague to cast a wide net and avoid accountability. A real employer knows exactly what they need.",
      advice: [
        "Ask the recruiter for a detailed job description before proceeding.",
        "Legitimate companies provide clear role expectations and team context.",
        "Check the company's official careers page to see if the role is listed there too.",
      ],
      example:
        "Scam postings are intentionally vague to attract as many applicants as possible.",
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
        "The posting is missing several key details that legitimate job descriptions typically include — such as specific responsibilities or requirements.",
      whyItMatters:
        "Incomplete descriptions can signal a hastily created posting or one designed to gather applicant data without genuine hiring intent.",
      advice: [
        "Request more details about the role before applying.",
        "Check if the company has listed the role on their official careers page or LinkedIn.",
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
      "The posting includes specific responsibilities, qualifications, and role details — a strong credibility signal.",
    whyItMatters:
      "A well-structured job description signals genuine hiring intent. Employers who know what they want write it down clearly.",
    advice: [
      "Continue standard verification before sharing sensitive personal information.",
    ],
  };
}