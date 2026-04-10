import { ShieldCheck } from "lucide-react"

const items = [
  "Never share sensitive personal info (SSN, bank details) before a verified hiring process.",
  "Research the company through independent sources, not just links in the posting.",
  "Be wary of jobs that require upfront payment for training or equipment.",
  "Use professional platforms (LinkedIn, Glassdoor) to verify recruiter identities.",
  "Trust your instincts — if something feels off, take extra time to verify before proceeding.",
]

export default function SafeChecklist() {
  return (
    <div className="safe-checklist">
      <div className="safe-checklist-header">
        <ShieldCheck size={16} />
        <span className="safe-checklist-title">
          Safe Application Checklist
        </span>
      </div>

      <ol className="safe-checklist-list">
        {items.map((item, i) => (
          <li key={i} className="safe-checklist-item">
            <span className="safe-checklist-number">
              {i + 1}
            </span>

            <span className="safe-checklist-text">
              {item}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}