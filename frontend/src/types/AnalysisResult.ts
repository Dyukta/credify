import type { Signal } from "./Signal";
import type { RiskLevel } from "./RiskLevel";

export interface ScoreDriver {
  signalId: string;
  title: string;
  riskLevel: RiskLevel;
  weightedContribution: number;
}

export interface AnalysisResult {
  url: string;
  domain: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  signals: Signal[];
  safetyChecklist: string[];
  verdictSummary: string;
  scoreDrivers: ScoreDriver[];
  isPartialData: boolean;
  analyzedAt: string;
  requestId?: string;
}