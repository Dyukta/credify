import type { RiskLevel } from "./RiskLevel";

export interface Signal {
  id: string;
  title: string;
  description: string;

  riskLevel: RiskLevel;

  confidence: number;
  category: "red_flags" | "domain_company" | "historical" | "positive";

  value?: string;
  explanation?: string;
  whyItMatters?: string;
  whatYouCanDo?: string[];
  example?: string;
  icon?: string;
}