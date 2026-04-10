import { useState } from "react";
import type { Signal } from "../../../types/Signal";
import Badge from "../../../shared/Badge";
import ProgressBar from "../../../shared/ProgressBar";

import {
  Mail,
  FileText,
  Clock,
  Globe,
  Star,
  History,
  ChevronDown,
  Circle
} from "lucide-react";

interface Props {
  signal: Signal;
}

const signalIcon: Record<string, any> = {
  email: Mail,
  document: FileText,
  clock: Clock,
  globe: Globe,
  star: Star,
  history: History,
};

export default function SignalRow({ signal }: Props) {
  const [open, setOpen] = useState(false);

  const Icon = signalIcon[signal.icon ?? ""] ?? Circle;

  return (
    <div className="signal-row">
      <button
        className="signal-row-header"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="signal-row-icon">
          <Icon size={18} />
        </div>

        <div className="signal-row-main">
          <div className="signal-row-title">
            <span>{signal.title}</span>
            <Badge level={signal.riskLevel} />
          </div>

          <div className="signal-row-meta">
            <span>{signal.value}</span>
            <span className="signal-confidence">
              {signal.confidence}% confidence
            </span>
          </div>

          <p className="signal-row-explanation">
            {signal.description}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`signal-row-chevron ${open ? "open" : ""}`}
        />
      </button>

      {open && (
        <div className="signal-row-body">
          <div>
            <p className="signal-section-title">Why This Matters</p>
            <p className="signal-section-text">
              {signal.whyItMatters}
            </p>
          </div>

          <div className="signal-advice">
            <p className="signal-section-title">What You Can Do</p>

            <ol className="signal-tips">
              {(signal.whatYouCanDo ?? []).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ol>
          </div>

          {signal.example && (
            <div>
              <p className="signal-example-label">Example</p>
              <p className="signal-example">"{signal.example}"</p>
            </div>
          )}

          <ProgressBar value={signal.confidence} height={4} />
        </div>
      )}
    </div>
  );
}