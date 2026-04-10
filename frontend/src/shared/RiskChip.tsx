import type { RiskLevel } from "../types/RiskLevel";

interface Props {
  risk: RiskLevel;
}

export default function RiskChip({ risk }: Props) {
  const base = "chip";

  const variants: Record<RiskLevel, string> = {
    low: "chip-green",
    medium: "chip-yellow",
    high: "chip-red",
  };

  return <span className={`${base} ${variants[risk]}`}>{risk} Risk</span>;
}