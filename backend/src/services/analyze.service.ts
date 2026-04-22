import { fetchJobPage } from "./fetcher.service";
import { parseJobPage } from "./parser.service";
import { scoreSignals, resolveRiskLevel } from "./scoring.service";
import { buildAnalysisResult } from "./insightBuilder.service";
import { AnalysisResult } from "../types/AnalysisResult";
import { sanitizeUrl } from "../utils/sanitizeUrl";
import { urlCache } from "../cache/memoryCache";
import { saveAnalysis, getAnalysisByUrl } from "../db/analysisRepo";

export async function analyzeJobPosting(
  rawUrl: string
): Promise<AnalysisResult & { cached?: boolean }> {
  const sanitized = sanitizeUrl(rawUrl);
  const normalizedUrl = sanitized.href;

  // Layer 1 — hot memory cache (same process, instant)
  const memCached = urlCache.get(normalizedUrl);
  if (memCached) {
    return { ...memCached, cached: true };
  }

  // Layer 2 — SQLite persistent cache (survives restarts, 6hr TTL)
  const dbCached = getAnalysisByUrl(normalizedUrl);
  if (dbCached) {
    // Warm memory cache on db hit
    urlCache.set(normalizedUrl, dbCached);
    return { ...dbCached, cached: true };
  }

  // Layer 3 — live analysis
  const html = await fetchJobPage(normalizedUrl);
  const parsed = await parseJobPage(html, normalizedUrl);
  const scoringResult = await scoreSignals(parsed);
  const riskLevel = resolveRiskLevel(scoringResult.riskScore);
  const domain = sanitized.hostname.replace(/^www\./, "");

  const result = buildAnalysisResult({
    url: normalizedUrl,
    domain,
    scoringResult,
    riskLevel,
  });

  // Save to both cache layers (non-blocking)
  urlCache.set(normalizedUrl, result);
  saveAnalysis(result);

  return result;
}