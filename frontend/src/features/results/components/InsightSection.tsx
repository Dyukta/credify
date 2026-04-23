import type { Signal } from "../../../types/Signal";
import SignalRow from "./SignalRow";
import { AlertTriangle, Globe, History, ShieldCheck, Briefcase } from "lucide-react";

type Category = "red_flags" | "domain_company" | "domain_info" | "historical" | "positive" | "job_title";

interface Props {
  category: Category;
  signals: Signal[];
}

const sectionMeta: Record<Category, { label: string; icon: React.ElementType }> = {
  red_flags: { label: "Red Flags", icon: AlertTriangle },
  domain_company: { label: "Domain & Company Info", icon: Globe        },
  domain_info: { label: "Additional Domain Info", icon: Globe       },
  historical: { label: "Historical Patterns", icon: History      },
  positive: { label: "Positive Signals", icon: ShieldCheck  },
  job_title: { label: "Job Title Analysis", icon: Briefcase    }
};

export default function InsightSection({ category, signals }: Props) {
  if (!signals.length) return null;

  const meta = sectionMeta[category] ?? {
    label: category.replace(/_/g, " "),
    icon: Globe,
  };
  const Icon = meta.icon;

  return (
    <div className="insight-section">
      <div className="insight-section-header">
        <Icon size={15} />
        <span>{meta.label}</span>
        <span className="insight-section-count">{signals.length}</span>
      </div>

      <div className="insight-section-list">
        {signals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}