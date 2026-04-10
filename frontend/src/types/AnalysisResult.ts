import type { Signal } from "./Signal";
import type { RiskLevel } from "./RiskLevel";

export interface AnalysisResult {
  url: string;
  score: number;
  riskLevel: RiskLevel;
  confidence: number;
  signals: Signal[];
}