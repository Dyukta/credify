import { Signal } from "../types/Signal";
import { ParsedJobPage } from "../services/parser.service";

function daysSince(dateStr: string): number | null {
  try {
    const posted = new Date(dateStr);
    if (isNaN(posted.getTime())) return null;
    const diffMs = new Date().getTime() - posted.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

export function repostFrequencySignal(data: ParsedJobPage): Signal {
  const { postingDate, hasSalaryMention } = data;

  if (!postingDate) {
    return {
      id: "repost_frequency",
      category: "historical",
      title: "Similar Past Postings",
      riskLevel: "medium",
      value: "Posting date unknown",
      confidence: 45,
      icon: "history",
      explanation:
        "No posting date was found. It is unclear how long this job has been listed or if it has been reposted.",
      whyItMatters:
        "Fake postings are often left up indefinitely to collect personal data. Not knowing when a posting went live makes it harder to assess its legitimacy.",
      advice: [
        "Search the job title and company name on multiple platforms to check for duplicate postings.",
        "Long-standing unfilled postings can indicate either a hard-to-fill role or a scam.",
      ],
    };
  }

  const daysOld = daysSince(postingDate);

  if (daysOld === null) {
    return {
      id: "repost_frequency",
      category: "historical",
      title: "Similar Past Postings",
      riskLevel: "medium",
      value: "Posting date unreadable",
      confidence: 40,
      icon: "history",
      explanation:
        "The posting date could not be parsed to determine how old this listing is.",
      whyItMatters:
        "Without a readable date it is impossible to assess whether this posting has been sitting unactioned for an unusually long time.",
      advice: ["Manually verify when the job was originally listed."],
    };
  }

  if (daysOld > 60 && !hasSalaryMention) {
    return {
      id: "repost_frequency",
      category: "historical",
      title: "Potentially Stale Posting",
      riskLevel: "high",
      value: `Posted ${daysOld} days ago`,
      confidence: 75,
      icon: "history",
      explanation:
        "This posting is over 60 days old with no salary information. Stale postings without compensation details are a common scam pattern.",
      whyItMatters:
        "Fake postings are often left up indefinitely to collect personal information. A real employer filling a role rarely leaves a listing active for two months without updating or closing it.",
      advice: [
        "Contact the company directly to confirm the role is still open.",
        "Avoid postings that never mention compensation and have been up for months.",
        "Check if the same posting appears on multiple job boards with different details.",
      ],
      example:
        "Fake postings are often left up indefinitely to collect personal information.",
    };
  }

  if (daysOld > 30) {
    return {
      id: "repost_frequency",
      category: "historical",
      title: "Older Job Posting",
      riskLevel: "medium",
      value: `Posted ${daysOld} days ago`,
      confidence: 60,
      icon: "history",
      explanation:
        "This posting is over a month old. It may still be active, but aged listings are worth verifying.",
      whyItMatters:
        "Most active roles are filled within 30 days. A posting that remains open beyond that warrants a quick check to confirm it is still active.",
      advice: [
        "Confirm the role is still available before spending time on your application.",
        "Reach out to the company HR directly through LinkedIn.",
      ],
    };
  }

  if (daysOld <= 7) {
    return {
      id: "repost_frequency",
      category: "historical",
      title: "Recent Job Posting",
      riskLevel: "low",
      value: `Posted ${daysOld} day${daysOld !== 1 ? "s" : ""} ago`,
      confidence: 78,
      icon: "history",
      explanation:
        "This is a recently posted job, suggesting an active and current hiring process.",
      whyItMatters:
        "Fresh postings are a positive signal — active employers post when they have an immediate need. Early applicants also tend to get faster responses.",
      advice: [
        "Apply promptly as fresh postings tend to receive faster responses.",
      ],
    };
  }

  return {
    id: "repost_frequency",
    category: "historical",
    title: "Active Posting",
    riskLevel: "low",
    value: `Posted ${daysOld} days ago`,
    confidence: 78,
    icon: "history",
    explanation:
      "This posting is within the normal active listing window, suggesting an ongoing hiring process.",
    whyItMatters:
      "A listing in the 1–4 week range is typical for an actively recruiting employer. This is a neutral-to-positive indicator.",
    advice: ["Proceed with standard application precautions."],
  };
}