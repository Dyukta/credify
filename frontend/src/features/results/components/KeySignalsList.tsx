import type { Signal } from "../../../types/Signal";
import { Check, AlertTriangle } from "lucide-react";

interface Props {
  signals: Signal[];
}

export default function KeySignalsList({ signals }: Props) {
  return (
    <div className="signals-panel">
      <p className="signals-title">Key Signals</p>

      <div className="signals-list">
        {signals.map((signal) => {
          const Icon =
            signal.riskLevel === "low" ? Check : AlertTriangle;

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
      </div>
    </div>
  );
}