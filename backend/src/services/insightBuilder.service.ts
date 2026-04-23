import { RiskLevel, Signal } from "../types/Signal";
import { AnalysisResult} from "../types/AnalysisResult";
import { ScoringResult } from "./scoring.service";

const BASE_CHECKLIST = [
  "Never share Aadhaar, PAN, passport, or bank details before a verified offer letter from an official company email.",
  "Always apply through the company's official careers page or verified job board — not via WhatsApp, Telegram, or Google Forms.",
  "Verify the recruiter exists on LinkedIn and their email matches the company domain.",
  "Search the company name on MCA (mca.gov.in) for Indian companies, or LinkedIn for global ones.",
  "If something feels off  trust that instinct and verify independently before proceeding.",
];

function buildChecklist(signals: Signal[]): string[] {
  const checklist = [...BASE_CHECKLIST];
  const highSignals = signals.filter((s) => s.riskLevel === "high");

  for (const s of highSignals) {
    switch (s.id) {
      case "domain_age":
        checklist.push(
          "Independently verify this company exists — search for news coverage, LinkedIn employees, and check WHOIS at whois.domaintools.com."
        );
        break;
      case "ghost_job":
        checklist.push(
          "Contact the hiring manager directly on LinkedIn to confirm this role is actively being filled before investing time in an application."
        );
        break;
      case "offer_realism":
        checklist.push(
          "Research the realistic market salary for this role on Glassdoor, LinkedIn Salary, or AmbitionBox before engaging further."
        );
        break;
      case "cross_platform_verify":
      case "careers_page":
        checklist.push(
          "Visit the company's official website directly and confirm this role is listed on their careers page before applying."
        );
        break;
    }
  }

  return [...new Set(checklist)];
}

function buildVerdictSummary(
  riskLevel: RiskLevel,
  riskScore: number,
  signals: Signal[],
  isPartialData: boolean
): string {
  const highSignals   = signals.filter((s) => s.riskLevel === "high");
  const mediumSignals = signals.filter((s) => s.riskLevel === "medium");

  const partialNote = isPartialData
    ? " Note: this site limited automated access, so some signals have reduced confidence."
    : "";

  if (riskLevel === "low") {
    const positiveCount = signals.filter((s) => s.riskLevel === "low").length;
    return (
      `This posting scored ${riskScore}/100 and shows mostly positive signals. ` +
      `${positiveCount} out of ${signals.length} checks passed cleanly. ` +
      `Standard precautions apply — verify the company independently before sharing personal documents.` +
      partialNote
    );
  }

  if (riskLevel === "high") {
    const topFlags = highSignals.slice(0, 2).map((s) => s.title.toLowerCase());
    const flagStr  = topFlags.length === 2
      ? `${topFlags[0]} and ${topFlags[1]}`
      : topFlags[0] ?? "multiple checks";

    return (
      `This posting scored ${riskScore}/100 and has serious red flags: ${flagStr}. ` +
      `${highSignals.length} signal${highSignals.length !== 1 ? "s" : ""} fired at high risk. ` +
      `Do not share personal information or pay any fees until you have independently verified this employer.` +
      partialNote
    );
  }

  const flagCount = highSignals.length + mediumSignals.length;
  const topFlag   = highSignals[0] ?? mediumSignals[0];
  const flagNote  = topFlag
    ? ` The most significant concern is ${topFlag.title.toLowerCase()}.`
    : "";

  return (
    `This posting scored ${riskScore}/100 and has ${flagCount} concern${flagCount !== 1 ? "s" : ""} worth reviewing.` +
    flagNote +
    ` Verify the company through independent sources before proceeding with an application.` +
    partialNote
  );
}

export interface InsightBuilderInput {
  url: string;
  domain: string;
  scoringResult: ScoringResult;
  riskLevel: RiskLevel;
  isPartialData: boolean;
}

export function buildAnalysisResult(input: InsightBuilderInput): AnalysisResult {
  const { url, domain, scoringResult, riskLevel, isPartialData } = input;
  const { signals, riskScore, confidence, scoreDrivers } = scoringResult;

  return {
    url,
    domain,
    riskScore,
    riskLevel,
    confidence,
    signals,
    safetyChecklist: buildChecklist(signals),
    verdictSummary:  buildVerdictSummary(riskLevel, riskScore, signals, isPartialData),
    scoreDrivers,
    isPartialData,
    analyzedAt: new Date().toISOString()
  };
}