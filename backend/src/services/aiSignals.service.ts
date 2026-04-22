import { GoogleGenerativeAI } from "@google/generative-ai";
import { Signal, RiskLevel } from "../types/Signal";
import { ParsedJobPage } from "./parser.service";
import pino from "pino";

const logger = pino({ name: "ai-signals" });

function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
}

interface AISignalResult {
  riskLevel: RiskLevel;
  confidence: number;
  explanation: string;
  advice: string[];
}

interface GeminiResponse {
  description_vagueness: AISignalResult;
  instant_offer_pattern: AISignalResult;
  upfront_payment_language: AISignalResult;
  communication_channel: AISignalResult;
  offer_realism: AISignalResult;
  inconsistency_check: AISignalResult;
}

function mediumFallback(id: string, title: string): Signal {
  return {
    id,
    category: "domain_company",
    title,
    riskLevel: "medium",
    value: "Could not evaluate",
    confidence: 20,
    icon: "document",
    explanation: "This signal could not be evaluated automatically. Manual review recommended.",
    whyItMatters: "Verify this aspect of the posting yourself before proceeding.",
    advice: ["Review the posting manually for this concern."],
  };
}

function getWhyItMatters(id: string): string {
  const map: Record<string, string> = {
    description_vagueness:
      "Legitimate employers know exactly what they need. Vague postings are either ghost jobs collecting resumes or scams casting a wide net.",
    instant_offer_pattern:
      "No legitimate employer hires without assessment in 2026. Instant offers skip verification on purpose — to get your data or money before you think clearly.",
    upfront_payment_language:
      "Legitimate companies never ask candidates to pay for training, equipment, registration, or background checks. Ever.",
    communication_channel:
      "Official companies communicate via company email domains and established platforms. WhatsApp, Telegram, and Google Forms are untraceable — that is the point.",
    offer_realism:
      "Unrealistic compensation or requirements are designed to trigger emotion over judgment. If it seems too good to be true for the role, it almost always is.",
    inconsistency_check:
      "Scam postings are assembled quickly and contain contradictions. Legitimate postings are written by people who know the role.",
  };
  return map[id] ?? "Verify this aspect of the posting before proceeding.";
}

function deriveCategory(id: string, riskLevel: RiskLevel): Signal["category"] {
  if (riskLevel === "low") return "positive";
  if (
    id === "description_vagueness" ||
    id === "instant_offer_pattern" ||
    id === "upfront_payment_language"
  ) return "red_flags";
  return "domain_company";
}

function toSignal(
  id: string,
  title: string,
  icon: string,
  raw: AISignalResult,
  value: string
): Signal {
  return {
    id,
    category: deriveCategory(id, raw.riskLevel),
    title,
    riskLevel: raw.riskLevel,
    value,
    confidence: Math.max(0, Math.min(100, raw.confidence)),
    icon,
    explanation: raw.explanation,
    whyItMatters: getWhyItMatters(id),
    advice: raw.advice,
  };
}

function buildPrompt(data: ParsedJobPage): string {
  const desc = (data.jobDescription ?? "").slice(0, 2500);
  const contactHints = data.rawContactMentions ?? "none found";

  return `You are a job scam detection engine. Analyze this job posting and return ONLY a valid JSON object — no markdown, no explanation, no preamble.

JOB DATA:
Title: ${data.jobTitle ?? "not found"}
Description (first 2500 chars): ${desc}
Company Name: ${data.companyName ?? "not found"}
Company Domain: ${data.companyDomain ?? "not found"}
Salary Mentioned: ${data.hasSalaryMention ? "yes" : "no"}
Posting Date: ${data.postingDate ?? "not found"}
Contact/Apply mentions in posting: ${contactHints}
Is Partial Data: ${data.isPartialData ? "yes — site blocked full access" : "no"}

EVALUATE EXACTLY THESE 6 SIGNALS. For each return riskLevel ("low"|"medium"|"high"), confidence (0-100 integer), explanation (1-2 sentences specific to this posting), and advice (array of 2-3 short actionable strings).

1. description_vagueness
   HIGH: Generic word salad, no real responsibilities/deliverables/qualifications. Could apply to anyone.
   MEDIUM: Some specifics but key details missing.
   LOW: Specific responsibilities, skills, team context, deliverables clearly described.
   Note: if isPartialData is true, set confidence ≤ 45 and riskLevel "medium" unless description clearly shows red flags.

2. instant_offer_pattern
   HIGH: Promises hiring without interview/assessment. Language like "immediate joining", "no interview", "start immediately", "direct selection".
   MEDIUM: Unusually fast process implied, no mention of any interview or assessment.
   LOW: Normal hiring process implied or stated.

3. upfront_payment_language
   HIGH: Any mention of fees, deposits, registration costs, training costs, equipment purchase, background check payment, or "refundable" anything the candidate must pay.
   MEDIUM: Ambiguous language about costs — could be employer or candidate paid.
   LOW: No payment language, or explicitly states company covers all costs.

4. communication_channel
   HIGH: Apply via WhatsApp, Telegram, Google Form, DM, personal email (gmail/yahoo/hotmail), or phone number as primary contact.
   MEDIUM: No clear apply channel stated or channel is ambiguous.
   LOW: Apply via official platform, company email domain, or company ATS link.

5. offer_realism
   HIGH: Implausibly high salary for the role/experience in India or US (2026). "No experience needed" for high pay. Passive income, unlimited earning promises.
   MEDIUM: Compensation not stated but role expectations seem mismatched with seniority.
   LOW: Compensation aligns with market rate or no red flags in expectations.

6. inconsistency_check
   HIGH: Clear contradictions — title says senior but description says freshers welcome; company name doesn't relate to domain; role duties don't match title; formatting suggests copy-paste from multiple sources.
   MEDIUM: Minor inconsistencies or missing context makes role hard to evaluate coherently.
   LOW: Title, description, company, and requirements are internally consistent.

RETURN EXACTLY THIS JSON STRUCTURE:
{
  "description_vagueness": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] },
  "instant_offer_pattern": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] },
  "upfront_payment_language": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] },
  "communication_channel": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] },
  "offer_realism": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] },
  "inconsistency_check": { "riskLevel": "...", "confidence": 0, "explanation": "...", "advice": ["..."] }
}`;
}

const VALID_RISK_LEVELS = new Set<string>(["low", "medium", "high"]);
const REQUIRED_KEYS: (keyof GeminiResponse)[] = [
  "description_vagueness",
  "instant_offer_pattern",
  "upfront_payment_language",
  "communication_channel",
  "offer_realism",
  "inconsistency_check",
];

function isValidResult(val: unknown): val is AISignalResult {
  if (typeof val !== "object" || val === null) return false;
  const v = val as Record<string, unknown>;
  return (
    VALID_RISK_LEVELS.has(v.riskLevel as string) &&
    typeof v.confidence === "number" &&
    typeof v.explanation === "string" &&
    Array.isArray(v.advice)
  );
}

function parseGeminiResponse(raw: string): GeminiResponse | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    for (const key of REQUIRED_KEYS) {
      if (!isValidResult(parsed[key])) {
        logger.warn({ key }, "Gemini response missing or invalid key");
        return null;
      }
    }
    return parsed as unknown as GeminiResponse;
  } catch (err) {
    logger.warn({ err }, "Failed to parse Gemini JSON response");
    return null;
  }
}

const FALLBACK_SIGNALS: Signal[] = [
  mediumFallback("description_vagueness", "Description Quality"),
  mediumFallback("instant_offer_pattern", "Hiring Process"),
  mediumFallback("upfront_payment_language", "Payment Language"),
  mediumFallback("communication_channel", "Communication Channel"),
  mediumFallback("offer_realism", "Offer Realism"),
  mediumFallback("inconsistency_check", "Internal Consistency"),
];

const RISK_VALUE: Record<RiskLevel, string> = {
  low: "No issues found",
  medium: "Some concerns",
  high: "Red flag detected",
};

export async function runAISignals(data: ParsedJobPage): Promise<Signal[]> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    });

    const result = await model.generateContent(buildPrompt(data));
    const rawText = result.response.text();
    const parsed = parseGeminiResponse(rawText);

    if (!parsed) {
      logger.warn("Gemini returned unparseable response — using fallbacks");
      return FALLBACK_SIGNALS;
    }

    return [
      toSignal("description_vagueness", "Description Quality", "document", parsed.description_vagueness, RISK_VALUE[parsed.description_vagueness.riskLevel]),
      toSignal("instant_offer_pattern", "Hiring Process", "briefcase", parsed.instant_offer_pattern, RISK_VALUE[parsed.instant_offer_pattern.riskLevel]),
      toSignal("upfront_payment_language", "Payment Language", "alert", parsed.upfront_payment_language, RISK_VALUE[parsed.upfront_payment_language.riskLevel]),
      toSignal("communication_channel", "Communication Channel", "email", parsed.communication_channel, RISK_VALUE[parsed.communication_channel.riskLevel]),
      toSignal("offer_realism", "Offer Realism", "currency", parsed.offer_realism, RISK_VALUE[parsed.offer_realism.riskLevel]),
      toSignal("inconsistency_check", "Internal Consistency", "search", parsed.inconsistency_check, RISK_VALUE[parsed.inconsistency_check.riskLevel]),
    ];
  } catch (err) {
    logger.error({ err }, "Gemini call failed — using fallbacks");
    return FALLBACK_SIGNALS;
  }
}