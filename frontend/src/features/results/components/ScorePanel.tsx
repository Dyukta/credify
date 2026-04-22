import type { RiskLevel } from "../../../types/RiskLevel";
import type { ScoreDriver } from "../../../types/AnalysisResult";
import { AlertCircle } from "lucide-react";

interface Props {
  riskScore:    number;
  riskLevel:    RiskLevel;
  scoreDrivers: ScoreDriver[];
}

const RISK_LABEL: Record<RiskLevel, string> = {
  high:   "High Risk",
  medium: "Medium Risk",
  low:    "Low Risk",
};

export default function ScorePanel({ riskScore, riskLevel, scoreDrivers }: Props) {
  return (
    <div className={`score-panel score-${riskLevel}`}>
      <div className="score-header">
        <AlertCircle size={16} />
        <span>Risk Score</span>
      </div>

      <div className="score-value">
        <span className="score-number">{riskScore}</span>
        <span className="score-max">/ 100</span>
      </div>

      <p className="score-label">{RISK_LABEL[riskLevel]}</p>

      {scoreDrivers.length > 0 && (
        <div className="score-drivers">
          <p className="score-drivers-label">Primarily driven by</p>
          <ul className="score-drivers-list">
            {scoreDrivers.map((d) => (
              <li key={d.signalId} className={`score-driver score-driver-${d.riskLevel}`}>
                <span className="score-driver-dot" />
                <span>{d.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}