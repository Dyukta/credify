import type { Signal } from "./Signal";
import type { RiskLevel } from "./RiskLevel";

export interface AnalysisResult {
  url: string;
  domain: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  signals: Signal[];
  safetyChecklist: string[];
  analyzedAt: string;
}