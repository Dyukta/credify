import { ParsedJobPage } from "../services/parser.service";
import { Signal } from "../types/Signal";
import { domainAgeSignal } from "./domainAge.signal";
import { careersPageSignal } from "./careersPage.signal";
import { companyRegistrationSignal } from "./companyRegistration.signal";
import { ghostJobSignal } from "./ghostJob.signal";
import { crossPlatformVerifySignal } from "./crossPlatformVerify.signal";
import { repostFrequencySignal } from "./repostFrequency.signal";
import { runAISignals } from "../services/aiSignals.service";
import pino from "pino";

const logger = pino({ name: "signals-index" });
const TECHNICAL_SIGNALS: Array<{ id: string; fn: (data: ParsedJobPage) => Signal | Promise<Signal> }> = [
  { id: "domain_age",  fn: domainAgeSignal  },
  { id: "careers_page", fn: careersPageSignal },
  { id: "company_registration", fn: companyRegistrationSignal },
  { id: "ghost_job", fn: ghostJobSignal  },
  { id: "cross_platform_verify",fn: crossPlatformVerifySignal},
  { id: "repost_frequency", fn: repostFrequencySignal}
];

function makeFallback(id: string): Signal {
  return {
    id,
    category: "domain_company",
    title: "Check Unavailable",
    riskLevel: "medium",
    value: "Could not evaluate",
    confidence: 20,
    icon: "clock",
    explanation: "This check could not be completed. Manual verification recommended.",
    whyItMatters: "Verify this aspect of the posting manually.",
    advice: ["Check this signal manually before proceeding."],
  };
}

async function runTechnicalSignals(data: ParsedJobPage): Promise<Signal[]> {
  return Promise.all(
    TECHNICAL_SIGNALS.map(async ({ id, fn }) => {
      try {
        return await fn(data);
      } catch (err) {
        logger.warn({ err, signal: id }, "Technical signal failed — using fallback");
        return makeFallback(id);
      }
    })
  );
}

export async function runAllSignals(data: ParsedJobPage): Promise<Signal[]> {
  const [technical, ai] = await Promise.all([
    runTechnicalSignals(data),
    runAISignals(data),
  ]);
  return [...technical, ...ai];
}