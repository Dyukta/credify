import { Building2, ExternalLink } from "lucide-react";
import type { Signal } from "../../../types/Signal";
import RiskChip from "../../../shared/RiskChip";

interface Props {
  signal: Signal | undefined;
}

export default function RegistrationPanel({ signal }: Props) {

  if (!signal) return null;

  const cin = signal.value?.startsWith("CIN:")
    ? signal.value.replace("CIN:", "").trim()
    : null;

  const mcaUrl = cin
    ? `https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do`
    : "https://www.mca.gov.in";

  return (
    <div className="registration-panel">
      <div className="registration-panel-header">
        <Building2 size={16} color="#2563eb" />
        <span className="registration-panel-title">
          Government Registration (MCA)
        </span>
        <RiskChip risk={signal.riskLevel} />
      </div>

      <div className="registration-row">
        <span className="registration-row-label">Status</span>
        <span className="registration-row-value">{signal.value}</span>
      </div>

      <div className="registration-row">
        <span className="registration-row-label">Confidence</span>
        <span className="registration-row-value">{signal.confidence}%</span>
      </div>

      <div className="registration-row">
        <span className="registration-row-label">Details</span>
        <span className="registration-row-value">{signal.explanation}</span>
      </div>

      {cin && (
        <div className="registration-row">
          <span className="registration-row-label">Verify on MCA Portal</span>
          <span className="registration-row-value">
            <a href={mcaUrl} target="_blank" rel="noopener noreferrer">
              View on MCA <ExternalLink size={11} style={{ display: "inline", marginLeft: 2 }} />
            </a>
          </span>
        </div>
      )}

      {signal.advice && signal.advice.length > 0 && (
        <div className="registration-row">
          <span className="registration-row-label">What You Can Do</span>
          <ol className="signal-tips" style={{ marginTop: 4 }}>
            {signal.advice.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ol>
        </div>
      )}

      <p className="registration-notice">
        Data sourced from Ministry of Corporate Affairs public records. Results
        are indicative only verify directly on the{" "}
        <a href="https://www.mca.gov.in" target="_blank" rel="noopener noreferrer">
          MCA portal
        </a>{" "}
        before making decisions.
      </p>
    </div>
  );
}