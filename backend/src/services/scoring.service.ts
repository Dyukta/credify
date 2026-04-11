import { allSignals } from '../signals'
import { ParsedJobPage } from './parser.service'
import { Signal, RiskLevel } from '../types/Signal'

const SIGNAL_WEIGHTS: Record<string, number> = {
  email_validity: 0.3,
  content_quality: 0.3,
  domain_age: 0.25,
  repost_frequency: 0.15,
}

const DEFAULT_WEIGHT = 0.2

const RISK_SCORE_MAP: Record<RiskLevel, number> = {
  low: 10,
  medium: 55,
  high: 90,
}

function clamp(num: number): number {
  return Math.max(0, Math.min(100, num))
}

export interface ScoringResult {
  signals: Signal[]
  riskScore: number
  confidence: number
}

export function scoreSignals(data: ParsedJobPage): ScoringResult {
  const signals = allSignals.map((fn) => fn(data))

  let scoreSum = 0
  let confidenceSum = 0
  let totalWeight = 0

  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.id] ?? DEFAULT_WEIGHT

    scoreSum += RISK_SCORE_MAP[signal.riskLevel] * weight
    confidenceSum += signal.confidence * weight
    totalWeight += weight
  }

  return {
    signals,
    riskScore: clamp(Math.round(scoreSum / totalWeight)),
    confidence: clamp(Math.round(confidenceSum / totalWeight)),
  }
}

export function resolveRiskLevel(score: number): RiskLevel {
  if (score >= 65) return 'high'
  if (score >= 35) return 'medium'
  return 'low'
}