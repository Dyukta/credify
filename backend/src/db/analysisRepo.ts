import db from "./database";
import crypto from "crypto";
import { AnalysisResult } from "../types/AnalysisResult";
import pino from "pino";

const logger = pino({ name: "analysis-repo" });

function hashUrl(url: string): string {
  return crypto.createHash("sha256").update(url.trim().toLowerCase()).digest("hex");
}

export function saveAnalysis(result: AnalysisResult): void {
  try {
    db.prepare(`
      INSERT OR REPLACE INTO analysis_results
        (url, url_hash, domain, risk_score, risk_level, confidence,
         signals, safety_checklist, verdict_summary, score_drivers,
         is_partial_data, analyzed_at)
      VALUES
        (@url, @urlHash, @domain, @riskScore, @riskLevel, @confidence,
         @signals, @safetyChecklist, @verdictSummary, @scoreDrivers,
         @isPartialData, @analyzedAt)
    `).run({
      url:             result.url,
      urlHash:         hashUrl(result.url),
      domain:          result.domain,
      riskScore:       result.riskScore,
      riskLevel:       result.riskLevel,
      confidence:      result.confidence,
      signals:         JSON.stringify(result.signals),
      safetyChecklist: JSON.stringify(result.safetyChecklist),
      verdictSummary:  result.verdictSummary,
      scoreDrivers:    JSON.stringify(result.scoreDrivers),
      isPartialData:   result.isPartialData ? 1 : 0,
      analyzedAt:      result.analyzedAt
    });
  } catch (err) {
    logger.warn({ err }, "saveAnalysis failed — non-fatal");
  }
}

export function getAnalysisByUrl(url: string): AnalysisResult | null {
  try {
    const row = db.prepare(`
      SELECT * FROM analysis_results
      WHERE url_hash = ?
      AND datetime(analyzed_at) > datetime('now', '-6 hours')
      LIMIT 1
    `).get(hashUrl(url)) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      url:             row.url as string,
      domain:          row.domain as string,
      riskScore:       row.risk_score as number,
      riskLevel:       row.risk_level as "low" | "medium" | "high",
      confidence:      row.confidence as number,
      signals:         JSON.parse(row.signals as string),
      safetyChecklist: JSON.parse(row.safety_checklist as string),
      verdictSummary:  (row.verdict_summary as string) ?? "",
      scoreDrivers:    JSON.parse((row.score_drivers as string) ?? "[]"),
      isPartialData:   Boolean(row.is_partial_data),
      analyzedAt:      row.analyzed_at as string
    };
  } catch (err) {
    logger.warn({ err }, "getAnalysisByUrl failed");
    return null;
  }
}

export type FeedbackVote = "correct" | "incorrect";

export function saveFeedback(
  url: string,
  domain: string,
  riskScore: number,
  riskLevel: string,
  vote: FeedbackVote
): void {
  try {
    db.prepare(`
      INSERT INTO feedback (url_hash, url, domain, risk_score, risk_level, vote)
      VALUES (@urlHash, @url, @domain, @riskScore, @riskLevel, @vote)
    `).run({
      urlHash:   hashUrl(url),
      url,
      domain,
      riskScore,
      riskLevel,
      vote,
    });
  } catch (err) {
    logger.warn({ err }, "saveFeedback failed — non-fatal");
  }
}

export function getDomainStats(domain: string) {
  try {
    const row = db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(risk_score) as avg_score,
        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
        MAX(analyzed_at) as last_seen
      FROM analysis_results
      WHERE domain = ?
    `).get(domain) as Record<string, unknown> | undefined;

    if (!row || !row.total) return null;

    return {
      totalAnalyses: row.total as number,
      avgRiskScore:  Math.round((row.avg_score as number) ?? 0),
      highRiskCount: row.high_risk as number,
      lastSeen:      row.last_seen as string,
    };
  } catch {
    return null;
  }
}