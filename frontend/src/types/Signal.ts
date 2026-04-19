import type { RiskLevel } from "./RiskLevel";

export interface Signal {
  id: string;
  title: string;
  explanation: string;
  whyItMatters?: string;
  riskLevel: RiskLevel;
  confidence: number;
  category:
    | "red_flags"
    | "domain_company"
    | "domain_info"
    | "historical"
    | "positive";
  value?: string;
  advice?: string[];
  example?: string;
  icon?: "email" | "document" | "clock" | "globe" | "star" | "history" | "building" | string;
}