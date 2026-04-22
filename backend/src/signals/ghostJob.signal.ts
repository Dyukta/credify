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

export function ghostJobSignal(data: ParsedJobPage): Signal {
  const { postingDate } = data;

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
      explanation:
        "The posting date could not be parsed. Ghost job risk cannot be assessed.",
      whyItMatters:
        "Posting age is one of the strongest indicators of a ghost job. Roles that stay open past 30–41 days are statistically more likely to be unfilled or fake.",
      advice: [
        "Manually check the listing on the source platform to confirm the posting date.",
      ],
    };
  }

  // Research: SHRM average fill time = 41 days (2024)
  // Research: >30 days = likely ghost per ResumeUp.AI analysis of 2025 LinkedIn data

  if (daysOld > 60) {
    return {
      id: "ghost_job",
      category: "historical",
      title: "Likely Ghost Job",
      riskLevel: "high",
      value: `Posted ${daysOld} days ago`,
      confidence: 82,
      icon: "history",
      explanation: `This posting has been active for ${daysOld} days — well past the 41-day average fill time. Research shows 40% of companies admit to posting jobs with no intention of hiring.`,
      whyItMatters:
        "A 2025 analysis found 27% of LinkedIn postings are ghost jobs. Roles open for 60+ days without closure are a strong indicator of either a ghost posting or a company that is not actively hiring.",
      advice: [
        "Message the hiring manager on LinkedIn directly to confirm the role is still open.",
        "Check if the role appears on the company's official careers page — if not listed there, it may be a ghost.",
        "Search 'company name + layoffs' or 'hiring freeze' to check if the company is actually recruiting.",
        "Do not invest significant time in applications to roles this old without first confirming they are active.",
      ],
      example:
        "40% of companies admit to posting ghost jobs. 79% of fake tech listings were still active when researchers checked months later.",
    };
  }

  if (daysOld > 30) {
    return {
      id: "ghost_job",
      category: "historical",
      title: "Possible Ghost Job",
      riskLevel: "medium",
      value: `Posted ${daysOld} days ago`,
      confidence: 65,
      icon: "history",
      explanation: `This posting is ${daysOld} days old, past the typical 30-day threshold used to identify likely ghost jobs.`,
      whyItMatters:
        "Industry data shows most active roles are filled within 30–41 days. A posting in this range warrants a quick check before investing time in an application.",
      advice: [
        "Confirm the role is still open before applying by messaging HR or checking the careers page.",
        "Look for recent company news about hiring or layoffs.",
      ],
    };
  }

  if (daysOld <= 7) {
    return {
      id: "ghost_job",
      category: "positive",
      title: "Fresh Job Posting",
      riskLevel: "low",
      value: `Posted ${daysOld} day${daysOld !== 1 ? "s" : ""} ago`,
      confidence: 82,
      icon: "history",
      explanation:
        "This is a very recently posted role — within the first week. Fresh postings have the highest likelihood of active hiring intent.",
      whyItMatters:
        "Early postings correlate strongly with genuine hiring need. Applying early also increases your chance of being seen before the applicant pool grows.",
      advice: [
        "Apply promptly — fresh postings receive faster responses and smaller applicant pools.",
      ],
    };
  }

  return {
    id: "ghost_job",
    category: "positive",
    title: "Active Posting Age",
    riskLevel: "low",
    value: `Posted ${daysOld} days ago`,
    confidence: 78,
    icon: "history",
    explanation: `Posted ${daysOld} days ago — within the normal active hiring window of 0–30 days.`,
    whyItMatters:
      "A posting in the 1–4 week range is consistent with an actively recruiting employer. This is a positive signal.",
    advice: ["Proceed with standard application steps."],
  };
}