import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const UNREALISTIC_PATTERNS = [
  /₹\s*\d{3,}[kK]\s*(\/\s*(day|hr|hour))/i,
  /\$\s*\d{3,}\s*(\/\s*(day|hr|hour))/i,
  /unlimited\s+(earning|income|commission)/i,
  /\d+\s*lakh\s*(\/|per)\s*(day|week)/i,
  /earn\s+(upto|up\s+to)\s+₹?\$?\d+[kK]?\s*(\/\s*(day|hr))/i,
  /passive\s+income/i,
  /work\s+from\s+home.*₹\s*\d{4,}/i
];

const REALISTIC_SALARY_PATTERNS = [
  /\$[\d,]+(\s*(–|-|to)\s*\$[\d,]+)?(\s*\/\s*(hour|hr|year|yr|month|annum))?/i,
  /₹[\d,]+(\s*(–|-|to)\s*₹[\d,]+)?/,
  /\b\d+(\.\d+)?\s*(LPA|lpa|L\/year|lac)/,
  /\b\d{2,3}[kK]\s*(–|-|to)\s*\d{2,3}[kK]\b/
];

export function repostFrequencySignal(data: ParsedJobPage): Signal {
  const text = (data.jobDescription ?? "") + " " + (data.jobTitle ?? "");

  const isUnrealistic = UNREALISTIC_PATTERNS.some((p) => p.test(text));

  if (isUnrealistic) {
    return {
      id: "salary_check",
      category: "red_flags",
      title: "Salary Claim",
      riskLevel: "high",
      value: "Unrealistic salary detected",
      confidence: 85,
      icon: "currency",
      explanation:
        "The posting contains salary claims that are unrealistically high for the described role: a common fraud pattern designed to attract desperate applicants.",
      whyItMatters:
        "Fraudulent postings routinely use inflated salaries to trigger emotion over judgment. If it looks too good to be true for the role, it almost always is.",
      advice: [
        "Check market rate for this role on Glassdoor, AmbitionBox or LinkedIn Salary.",
        "Unrealistic pay is one of the strongest fraud indicators proceed with extreme caution.",
      ]
    };
  }

  const hasRealisticSalary = REALISTIC_SALARY_PATTERNS.some((p) => p.test(text));

  if (hasRealisticSalary) {
    return {
      id: "salary_check",
      category: "positive",
      title: "Salary Claim",
      riskLevel: "low",
      value: "Salary looks realistic",
      confidence: 72,
      icon: "currency",
      explanation:
        "The salary mentioned appears realistic for the role and location: a positive signal.",
      whyItMatters:
        "Realistic compensation aligned with market rates suggests the posting was written by someone who knows the role.",
      advice: [
        "Still verify the exact range on Glassdoor or LinkedIn Salary before negotiating.",
      ]
    };
  }

  return {
    id: "salary_check",
    category: "positive",
    title: "Salary Disclosure",
    riskLevel: "low",
    value: "No salary mentioned",
    confidence: 50,
    icon: "currency",
    explanation:
      "No salary information was found. This is normal most companies do not disclose compensation in the posting.",
    whyItMatters:
      "Salary non disclosure is standard practice across most industries and regions.",
    advice: [
      "Research the market rate for this role on Glassdoor or LinkedIn Salary before your interview.",
    ],
  };
}