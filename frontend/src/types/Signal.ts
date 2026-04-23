import type { RiskLevel } from "./RiskLevel";

export type { RiskLevel };

export interface Signal {
  id: string;
  title: string;
  explanation: string;
  whyItMatters?: string;
  riskLevel: RiskLevel;
  confidence: number;
  category: "red_flags" | "domain_company" | "historical" | "positive" | "job_title";
  value?: string;
  advice?: string[];
  example?: string;
  icon?: "email" | "document" | "clock" | "globe" | "star" | "history" | "building" | "briefcase" | "alert" | "search" | "currency" | string;
}