export type RiskLevel = "low" | "medium" | "high";

export type SignalCategory = "red_flags" | "domain_company" | "domain_info" | "historical"| "positive";

export interface Signal {
  id: string;
  category: SignalCategory;
  title: string;
  riskLevel: RiskLevel;
  value: string;
  confidence: number;
  explanation: string;
  whyItMatters?: string;
  advice: string[];
  example?: string;
  icon?: string;
}