import { ShieldCheck } from "lucide-react";

interface Props {
  items: string[];
}

export default function SafeChecklist({ items }: Props) {
  return (
    <div className="safe-checklist">
      <div className="safe-checklist-header">
        <ShieldCheck size={16} />
        <span className="safe-checklist-title">Safe Application Checklist</span>
      </div>

      <ol className="safe-checklist-list">
        {items.map((item, i) => (
          <li key={i} className="safe-checklist-item">
            <span className="safe-checklist-number">{i + 1}</span>
            <span className="safe-checklist-text">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}