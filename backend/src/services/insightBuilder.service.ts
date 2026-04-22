import { RiskLevel, Signal } from "../types/Signal";
import { AnalysisResult } from "../types/AnalysisResult";
import { ScoringResult } from "./scoring.service";

const BASE_CHECKLIST = [
  "Never share Aadhaar, PAN, passport, or bank details before a verified offer letter from an official company email.",
  "Always apply through the company's official careers page or verified job board — not via WhatsApp, Telegram, or Google Forms.",
  "Verify the recruiter exists on LinkedIn and their email matches the company domain.",
  "Search the company name on MCA (mca.gov.in) for Indian companies, or LinkedIn for global ones.",
  "If something feels off — trust that instinct and verify independently before proceeding.",
];

function buildChecklist(riskLevel: RiskLevel, signals: Signal[]): string[] {
  const checklist = [...BASE_CHECKLIST];
  const highSignals = signals.filter((s) => s.riskLevel === "high");

  // Add specific items based on which signals actually fired
  for (const s of highSignals) {
    switch (s.id) {
      case "upfront_payment_language":
        checklist.push(
          "Do not pay any fee for training, registration, equipment, or background checks — legitimate employers never charge candidates."
        );
        break;
      case "communication_channel":
        checklist.push(
          "Only communicate through official company email addresses or the platform you found the job on. Refuse to move to WhatsApp or Telegram."
        );
        break;
      case "instant_offer_pattern":
        checklist.push(
          "Demand a proper interview process before accepting any offer. No legitimate company in 2026 hires without assessment."
        );
        break;
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

  // Deduplicate in case multiple signals trigger similar advice
  return [...new Set(checklist)];
}

export interface InsightBuilderInput {
  url: string;
  domain: string;
  scoringResult: ScoringResult;
  riskLevel: RiskLevel;
}

export function buildAnalysisResult(input: InsightBuilderInput): AnalysisResult {
  const { url, domain, scoringResult, riskLevel } = input;

  return {
    url,
    domain,
    riskScore: scoringResult.riskScore,
    riskLevel,
    confidence: scoringResult.confidence,
    signals: scoringResult.signals,
    safetyChecklist: buildChecklist(riskLevel, scoringResult.signals),
    analyzedAt: new Date().toISOString(),
  };
}