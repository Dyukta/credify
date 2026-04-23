import type { Signal } from "../../../types/Signal";
import { Check, AlertTriangle } from "lucide-react";

const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface Props {
  signals: Signal[];
}

export default function KeySignalsList({ signals }: Props) {
  const topSignals = [...signals]
    .sort((a, b) => (RISK_ORDER[a.riskLevel] ?? 1) - (RISK_ORDER[b.riskLevel] ?? 1))
    .slice(0, 6);

  const hiddenCount = signals.length - topSignals.length;

  return (
    <div className="signals-panel">
      <p className="signals-title">Key Signals</p>

      <div className="signals-list">
        {topSignals.map((signal) => {
          const Icon = signal.riskLevel === "low" ? Check : AlertTriangle;
          return (
            <div
              key={signal.id}
              className={`signal-item signal-${signal.riskLevel}`}
            >
              <Icon size={13} />
              <span className="signal-text">{signal.title}</span>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <p className="signals-hidden-count">
            +{hiddenCount} more signal{hiddenCount > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}