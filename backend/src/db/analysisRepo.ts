import db from "./database";
import crypto from "crypto";
import { AnalysisResult } from "../types/AnalysisResult";

function hashUrl(url: string): string {
  return crypto
    .createHash("sha256")
    .update(url.trim().toLowerCase())
    .digest("hex");
}

export function saveAnalysis(result: AnalysisResult): void {
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO analysis_results
        (url, url_hash, domain, risk_score, risk_level, confidence,
         signals, safety_checklist, analyzed_at)
      VALUES
        (@url, @urlHash, @domain, @riskScore, @riskLevel, @confidence,
         @signals, @safetyChecklist, @analyzedAt)
    `);

    stmt.run({
      url: result.url,
      urlHash: hashUrl(result.url),
      domain: result.domain,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      confidence: result.confidence,
      signals: JSON.stringify(result.signals),
      safetyChecklist: JSON.stringify(result.safetyChecklist),
      analyzedAt: result.analyzedAt,
    });
  } catch {
    // Non-fatal — cache write failure should not break the response
  }
}

export function getAnalysisByUrl(url: string): AnalysisResult | null {
  try {
    const row = db
      .prepare(
        `SELECT * FROM analysis_results
         WHERE url_hash = ?
         AND datetime(analyzed_at) > datetime('now', '-6 hours')
         LIMIT 1`
      )
      .get(hashUrl(url)) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      url: row.url as string,
      domain: row.domain as string,
      riskScore: row.risk_score as number,
      riskLevel: row.risk_level as "low" | "medium" | "high",
      confidence: row.confidence as number,
      signals: JSON.parse(row.signals as string),
      safetyChecklist: JSON.parse(row.safety_checklist as string),
      analyzedAt: row.analyzed_at as string,
    };
  } catch {
    return null;
  }
}

export interface DomainStats {
  totalAnalyses: number;
  avgRiskScore: number;
  highRiskCount: number;
  lastSeen: string;
}

export function getDomainStats(domain: string): DomainStats | null {
  try {
    const row = db
      .prepare(
        `SELECT
           COUNT(*) as total,
           AVG(risk_score) as avg_score,
           SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
           MAX(analyzed_at) as last_seen
         FROM analysis_results
         WHERE domain = ?`
      )
      .get(domain) as Record<string, unknown> | undefined;

    if (!row || !row.total) return null;

    return {
      totalAnalyses: row.total as number,
      avgRiskScore: Math.round((row.avg_score as number) ?? 0),
      highRiskCount: row.high_risk as number,
      lastSeen: row.last_seen as string,
    };
  } catch {
    return null;
  }
}