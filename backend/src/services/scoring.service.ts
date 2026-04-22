import { runAllSignals } from "../signals";
import { ParsedJobPage } from "./parser.service";
import { Signal, RiskLevel } from "../types/Signal";
import pino from "pino";

const logger = pino({ name: "scoring-service" });

const SIGNAL_WEIGHTS: Record<string, number> = {
  instant_offer_pattern:    0.18,
  ghost_job:                0.15,
  careers_page:             0.13,
  domain_age:               0.12,
  description_vagueness:    0.10,
  upfront_payment_language: 0.10,
  cross_platform_verify:    0.08,
  communication_channel:    0.07,
  offer_realism:            0.05,
  inconsistency_check:      0.02,
};

const DEFAULT_WEIGHT = 0.02;

const RISK_SCORE_MAP: Record<RiskLevel, number> = {
  low:    10,
  medium: 55,
  high:   90,
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export interface ScoringResult {
  signals: Signal[];
  riskScore: number;
  confidence: number;
}

export async function scoreSignals(data: ParsedJobPage): Promise<ScoringResult> {
  const signals = await runAllSignals(data);

  let scoreSum = 0;
  let confidenceSum = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.id] ?? DEFAULT_WEIGHT;
    scoreSum      += RISK_SCORE_MAP[signal.riskLevel] * weight;
    confidenceSum += signal.confidence * weight;
    totalWeight   += weight;
  }

  if (totalWeight === 0) {
    logger.warn("No signals scored — returning neutral result");
    return { signals, riskScore: 50, confidence: 20 };
  }

  return {
    signals,
    riskScore:  clamp(Math.round(scoreSum / totalWeight)),
    confidence: clamp(Math.round(confidenceSum / totalWeight)),
  };
}

export function resolveRiskLevel(score: number): RiskLevel {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}