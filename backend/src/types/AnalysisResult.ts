import type { RiskLevel, Signal } from './Signal'

export interface AnalysisResult {
  url: string
  domain: string
  riskScore: number
  riskLevel: RiskLevel
  confidence: number
  signals: Signal[]
  safetyChecklist: string[]
  analyzedAt: string
}