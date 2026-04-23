import { fetchJobPage } from "./fetcher.service";
import { parseJobPage } from "./parser.service";
import { scoreSignals, resolveRiskLevel } from "./scoring.service";
import { buildAnalysisResult } from "./insightBuilder.service";
import { AnalysisResult } from "../types/AnalysisResult";
import { sanitizeUrl } from "../utils/sanitizeUrl";
import { urlCache } from "../cache/memoryCache";
import { saveAnalysis, getAnalysisByUrl } from "../db/analysisRepo";

export async function analyzeJobPosting(
  rawUrl: string,
  abortSignal?: AbortSignal
): Promise<AnalysisResult> {
  const sanitized = sanitizeUrl(rawUrl);
  const normalizedUrl = sanitized.href;

  const memCached = urlCache.get(normalizedUrl);
  if (memCached) return memCached;

  const dbCached = getAnalysisByUrl(normalizedUrl);
  if (dbCached) {
    urlCache.set(normalizedUrl, dbCached);
    return dbCached;
  }

  const html          = await fetchJobPage(normalizedUrl, abortSignal);
  const parsed        = await parseJobPage(html, normalizedUrl);
  const scoringResult = await scoreSignals(parsed);
  const riskLevel     = resolveRiskLevel(scoringResult.riskScore);
  const domain        = sanitized.hostname.replace(/^www\./, "");

  const result = buildAnalysisResult({
    url:           normalizedUrl,
    domain,
    scoringResult,
    riskLevel,
    isPartialData: parsed.isPartialData,
  });

  urlCache.set(normalizedUrl, result);
  saveAnalysis(result);

  return result;
}