import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

const SCAM_TITLE_PATTERNS = [
  /earn\s*[\d₹$]+/i,
  /\d+[kK]?\s*(\/|-|per)\s*(day|week|month)/i,
  /urgent(ly)?\s*(hiring|required|needed|wanted)/i,
  /work\s*from\s*home/i,
  /online\s*(job|work|earning)/i,
  /part\s*time\s*(earn|income|job)/i,
  /home\s*based\s*(job|work)/i,
  /data\s*entry\s*(work|job|operator)/i,
  /form\s*filling/i,
  /copy\s*paste\s*(job|work)/i,
  /typist\s*(job|work|needed)/i,
  /referral\s*(program|job|earn)/i,
  /no\s*experience\s*(needed|required)/i,
  /immediate\s*joiners?\s*(required|needed)/i,
  /fresher[s]?\s*(required|needed|wanted|urgent)/i,
  /multiple\s*(openings|vacancies|positions)\s*urgent/i,
];

const LEGITIMATE_TITLE_SIGNALS = [
  /(engineer|developer|architect|programmer)/i,
  /(designer|ux|ui|product)/i,
  /(manager|director|head\s+of|vp\s+of|chief)/i,
  /(analyst|scientist|researcher)/i,
  /(specialist|coordinator|consultant|advisor)/i,
  /(intern|associate|trainee)/i,
  /(accountant|auditor|finance|controller)/i,
  /(nurse|doctor|physician|therapist)/i,
  /(teacher|professor|instructor|lecturer)/i,
  /(sales|marketing|operations|logistics)/i,
  /(writer|editor|content|copywriter)/i,
  /(support|service|success|representative)/i,
];

export function jobTitleRealismSignal(data: ParsedJobPage): Signal {
  const title = data.jobTitle;

  if (!title || title.trim().length === 0) {
    return {
      id: "job_title_realism",
      category: "red_flags",
      title: "Job Title Missing",
      riskLevel: "medium",
      value: "No title found",
      confidence: 60,
      icon: "briefcase",
      explanation:
        "No job title was detected in this posting. Legitimate job postings always have a clear, specific title.",
      whyItMatters:
        "A missing job title is unusual for any real role. It may indicate a poorly structured or automatically generated scam posting.",
      advice: [
        "Check the original posting to confirm if a title is present.",
        "Be cautious about roles with no clear title — legitimate employers name their roles precisely.",
      ],
    };
  }

  const titleLower = title.toLowerCase();

  const scamPatternMatched = SCAM_TITLE_PATTERNS.find((p) => p.test(title));
  if (scamPatternMatched) {
    return {
      id: "job_title_realism",
      category: "red_flags",
      title: "Suspicious Job Title",
      riskLevel: "high",
      value: title.slice(0, 80),
      confidence: 88,
      icon: "briefcase",
      explanation: `The job title "${title.slice(0, 60)}" matches patterns commonly used in fraudulent or low-quality postings.`,
      whyItMatters:
        "Scam postings often use vague, income-focused, or urgency-driven titles to attract desperate job seekers. Real employers use specific, role-based titles.",
      advice: [
        "Search for the exact title on LinkedIn Jobs to see if legitimate companies post similar roles.",
        "Titles focused on earnings rather than function are a strong scam indicator.",
        "Look for the role on the company's official careers page.",
      ],
      example:
        'Titles like "Earn ₹50k/month - Work From Home" or "Urgent Data Entry Operator" are classic scam patterns.',
    };
  }

  const hasLegitimateSignal = LEGITIMATE_TITLE_SIGNALS.some((p) =>
    p.test(titleLower)
  );

  if (hasLegitimateSignal) {
    return {
      id: "job_title_realism",
      category: "positive",
      title: "Realistic Job Title",
      riskLevel: "low",
      value: title.slice(0, 80),
      confidence: 82,
      icon: "briefcase",
      explanation: `"${title.slice(0, 60)}" is a specific, function-based job title consistent with legitimate hiring.`,
      whyItMatters:
        "Real employers use precise titles that reflect the actual role and seniority. A specific title signals genuine hiring intent.",
      advice: [
        "Verify the title matches the job description — discrepancies can indicate a bait-and-switch posting.",
      ],
    };
  }

  // Title exists but neither scam nor clearly legitimate
  return {
    id: "job_title_realism",
    category: "domain_company",
    title: "Unverified Job Title",
    riskLevel: "medium",
    value: title.slice(0, 80),
    confidence: 50,
    icon: "briefcase",
    explanation: `The title "${title.slice(0, 60)}" does not match known scam patterns but could not be confirmed as a standard role title.`,
    whyItMatters:
      "An unfamiliar or unusual title warrants a quick check — search for it on LinkedIn to see if other companies post similar roles.",
    advice: [
      "Search for the role title on LinkedIn Jobs to gauge how common it is.",
      "Ask the recruiter for a full job description if the title is unclear.",
    ],
  };
}