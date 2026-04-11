import { RiskLevel, Signal } from '../types/Signal'
import { AnalysisResult } from '../types/AnalysisResult'
import { ScoringResult } from './scoring.service'

const BASE_CHECKLIST = [
  'Never share sensitive personal info before a verified hiring process.',
  'Research the company through independent sources.',
  'Avoid jobs requiring upfront payment.',
  'Verify recruiter identities on professional platforms.',
  'If something feels suspicious, verify before proceeding.',
]

const HIGH_RISK_ADDITIONS = [
  'Do not send ID or financial documents until the company is verified.',
  'Verify the company through official business registries.',
]

const MEDIUM_RISK_ADDITIONS = [
  'Request a video call with the recruiter before proceeding.',
]

function buildChecklist(
  riskLevel: RiskLevel,
  signals: Signal[]
): string[] {
  const checklist = [...BASE_CHECKLIST]

  if (riskLevel === 'high') checklist.push(...HIGH_RISK_ADDITIONS)
  if (riskLevel === 'medium') checklist.push(...MEDIUM_RISK_ADDITIONS)

  const freeEmailFlag = signals.some(
    (s) => s.id === 'email_validity' && s.riskLevel === 'high'
  )

  if (freeEmailFlag) {
    checklist.push(
      'Verify recruiter identity on LinkedIn before sharing your resume.'
    )
  }

  return checklist
}

export interface InsightBuilderInput {
  url: string
  domain: string
  scoringResult: ScoringResult
  riskLevel: RiskLevel
}

export function buildAnalysisResult(
  input: InsightBuilderInput
): AnalysisResult {
  const { url, domain, scoringResult, riskLevel } = input

  return {
    url,
    domain,
    riskScore: scoringResult.riskScore,
    riskLevel,
    confidence: scoringResult.confidence,
    signals: scoringResult.signals,
    safetyChecklist: buildChecklist(riskLevel, scoringResult.signals),
    analyzedAt: new Date().toISOString(),
  }
} 