import { fetchJobPage } from "./fetcher.service";
import { parseJobPage } from "./parser.service";
import { scoreSignals, resolveRiskLevel } from "./scoring.service";
import { buildAnalysisResult } from "./insightBuilder.service";
import { AnalysisResult } from "../types/AnalysisResult";
import { sanitizeUrl } from "../utils/sanitizeUrl";

export async function analyzeJobPosting(
  rawUrl: string
): Promise<AnalysisResult> {
  const sanitized = sanitizeUrl(rawUrl);
  const html = await fetchJobPage(sanitized.href);
  const parsed = parseJobPage(html, sanitized.href);
  const scoringResult = await scoreSignals(parsed);
  const riskLevel = resolveRiskLevel(scoringResult.riskScore);
  const domain = sanitized.hostname.replace(/^www\./, "");

  return buildAnalysisResult({ url: sanitized.href, domain, scoringResult, riskLevel });
}