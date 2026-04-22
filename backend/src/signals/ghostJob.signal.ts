import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

function daysSince(dateStr: string): number | null {
  try {
    const posted = new Date(dateStr);
    if (isNaN(posted.getTime())) return null;
    return Math.floor((Date.now() - posted.getTime()) / 86_400_000);
  } catch {
    return null;
  }
}

type IndustryBucket = "tech" | "legal_finance" | "construction" | "general";

interface GhostThresholds {
  freshDays:  number;  
  activeDays: number;   
  mediumDays: number;  
}

const INDUSTRY_THRESHOLDS: Record<IndustryBucket, GhostThresholds> = {
  tech:              { freshDays: 7,  activeDays: 21, mediumDays: 45 },
  legal_finance:     { freshDays: 7,  activeDays: 30, mediumDays: 60 },
  construction:      { freshDays: 14, activeDays: 45, mediumDays: 90 },
  general:           { freshDays: 7,  activeDays: 30, mediumDays: 60 },
};

const TECH_PATTERNS = [
  /\b(engineer|developer|architect|programmer|devops|fullstack|frontend|backend|data\s+scientist|ml\s+engineer|sre|qa\s+engineer|cloud)\b/i,
  /\b(software|react|node|python|java|golang|typescript|kubernetes|aws|gcp|azure)\b/i,
];

const LEGAL_FINANCE_PATTERNS = [
  /\b(lawyer|attorney|legal|counsel|compliance|auditor|chartered\s+accountant|ca\s+|cfa|analyst|investment|banker|finance\s+manager)\b/i,
];

const CONSTRUCTION_PATTERNS = [
  /\b(civil|construction|site\s+engineer|project\s+manager|contractor|architect|surveyor|infrastructure|foreman)\b/i,
];

function detectIndustry(title: string | null): IndustryBucket {
  if (!title) return "general";
  if (TECH_PATTERNS.some((p) => p.test(title)))             return "tech";
  if (LEGAL_FINANCE_PATTERNS.some((p) => p.test(title)))    return "legal_finance";
  if (CONSTRUCTION_PATTERNS.some((p) => p.test(title)))     return "construction";
  return "general";
}

export function ghostJobSignal(data: ParsedJobPage): Signal {
  const { postingDate, jobTitle } = data;

  if (!postingDate) {
    return {
      id: "ghost_job",
      category: "historical",
      title: "Ghost Job Risk",
      riskLevel: "medium",
      value: "Posting date unknown",
      confidence: 45,
      icon: "history",
      explanation:
        "No posting date was found. Ghost jobs — postings with no real intent to hire — are impossible to detect without a date.",
      whyItMatters:
        "27% of online job listings in 2025 are estimated to be ghost jobs with no active hiring. Without a posting date, this risk cannot be assessed.",
      advice: [
        "Search the job title + company name on LinkedIn to check how long this listing has been active.",
        "Message the hiring manager directly on LinkedIn to confirm the role is actively being filled.",
        "Check if the same role appears on the company's official careers page.",
      ],
    };
  }

  const daysOld = daysSince(postingDate);

  if (daysOld === null) {
    return {
      id: "ghost_job",
      category: "historical",
      title: "Ghost Job Risk",
      riskLevel: "medium",
      value: "Date unreadable",
      confidence: 35,
      icon: "history",
      explanation: "The posting date could not be parsed. Ghost job risk cannot be assessed.",
      whyItMatters:
        "Posting age is one of the strongest indicators of a ghost job. Roles that stay open past 30–41 days are statistically more likely to be unfilled or fake.",
      advice: [
        "Manually check the listing on the source platform to confirm the posting date.",
      ],
    };
  }

  const industry   = detectIndustry(jobTitle);
  const thresholds = INDUSTRY_THRESHOLDS[industry];
  const industryLabel = industry === "general" ? "" : ` for ${industry.replace("_", "/")} roles`;

  if (daysOld <= thresholds.freshDays) {
    return {
      id: "ghost_job",
      category: "positive",
      title: "Fresh Job Posting",
      riskLevel: "low",
      value: `Posted ${daysOld} day${daysOld !== 1 ? "s" : ""} ago`,
      confidence: 82,
      icon: "history",
      explanation:
        `Very recently posted${industryLabel} — within the first ${thresholds.freshDays} days. Fresh postings have the highest likelihood of active hiring intent.`,
      whyItMatters:
        "Early postings correlate strongly with genuine hiring need. Applying early also improves your chances before the applicant pool grows.",
      advice: [
        "Apply promptly — fresh postings receive faster responses and smaller applicant pools.",
      ],
    };
  }

  if (daysOld <= thresholds.activeDays) {
    return {
      id: "ghost_job",
      category: "positive",
      title: "Active Posting Age",
      riskLevel: "low",
      value: `Posted ${daysOld} days ago`,
      confidence: 78,
      icon: "history",
      explanation:
        `Posted ${daysOld} days ago — within the normal active hiring window${industryLabel} of ${thresholds.freshDays}–${thresholds.activeDays} days.`,
      whyItMatters:
        "A posting within the active hiring window is consistent with a genuinely recruiting employer.",
      advice: ["Proceed with standard application steps."],
    };
  }

  if (daysOld <= thresholds.mediumDays) {
    return {
      id: "ghost_job",
      category: "historical",
      title: "Possible Ghost Job",
      riskLevel: "medium",
      value: `Posted ${daysOld} days ago`,
      confidence: 65,
      icon: "history",
      explanation:
        `This posting is ${daysOld} days old — past the typical active window${industryLabel} of ${thresholds.activeDays} days.`,
      whyItMatters:
        "Industry data shows most active roles are filled within their typical window. A posting in this range warrants a quick check before investing time in an application.",
      advice: [
        "Confirm the role is still open before applying by messaging HR or checking the careers page.",
        "Look for recent company news about hiring or layoffs.",
      ],
    };
  }

  return {
    id: "ghost_job",
    category: "historical",
    title: "Likely Ghost Job",
    riskLevel: "high",
    value: `Posted ${daysOld} days ago`,
    confidence: 82,
    icon: "history",
    explanation:
      `This posting has been active for ${daysOld} days — well past the ${thresholds.mediumDays}-day threshold${industryLabel}. Research shows 40% of companies admit to posting jobs with no intention of hiring.`,
    whyItMatters:
      "A 2025 analysis found 27% of LinkedIn postings are ghost jobs. Roles open this long without closure are a strong indicator of either a ghost posting or a company not actively hiring.",
    advice: [
      "Message the hiring manager on LinkedIn directly to confirm the role is still open.",
      "Check if the role appears on the company's official careers page.",
      "Search 'company name + layoffs' or 'hiring freeze' to check if they are actually recruiting.",
      "Do not invest significant time without first confirming the role is active.",
    ],
    example:
      "40% of companies admit to posting ghost jobs. 79% of fake tech listings were still active when researchers checked months later.",
  };
}