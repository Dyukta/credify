import type { RiskLevel } from "../types/RiskLevel";
import { riskLabel } from "../types/RiskLevel";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface BadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
}

export default function Badge({ level, size = "sm" }: BadgeProps) {
  const Icon = level === "low" ? CheckCircle : AlertTriangle;

  return (
    <span className={`badge badge-${level} badge-${size}`} role="status">
      <Icon size={14} />
      {riskLabel[level]}
    </span>
  );
}