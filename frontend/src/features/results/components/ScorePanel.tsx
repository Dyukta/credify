import type { RiskLevel } from "../../../types/RiskLevel";
import { AlertCircle } from "lucide-react";

interface Props {
  score: number;
  riskLevel: RiskLevel;
}

export default function ScorePanel({ score, riskLevel }: Props) {
  return (
    <div className={`score-panel score-${riskLevel}`}>
      <div className="score-header">
        <AlertCircle size={16} />
        <span>Risk Score</span>
      </div>

      <div className="score-value">
        <span className="score-number">{score}</span>
        <span className="score-max">/ 100</span>
      </div>

      <p className="score-label">{riskLevel} risk</p>
    </div>
  );
}