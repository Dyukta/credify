import { ParsedJobPage } from "../services/parser.service";
import { Signal } from "../types/Signal";
import { domainAgeSignal } from "./domainAge.signal";
import { careersPageSignal } from "./careersPage.signal";
import { companyRegistrationSignal } from "./companyRegistration.signal";
import { ghostJobSignal } from "./ghostJob.signal";
import { crossPlatformVerifySignal } from "./crossPlatformVerify.signal";
import { runAISignals } from "../services/aiSignals.service";
import pino from "pino";

const logger = pino({ name: "signals-index" });

type SignalFn = (data: ParsedJobPage) => Signal | Promise<Signal>;

const TECHNICAL_SIGNALS: SignalFn[] = [
  domainAgeSignal,
  careersPageSignal,
  companyRegistrationSignal,
  ghostJobSignal,
  crossPlatformVerifySignal,
];

async function runTechnicalSignals(data: ParsedJobPage): Promise<Signal[]> {
  return Promise.all(
    TECHNICAL_SIGNALS.map(async (fn) => {
      try {
        return await fn(data);
      } catch (err) {
        logger.warn({ err, signal: fn.name }, "Technical signal failed — using fallback");
        return {
          id: fn.name,
          category: "domain_company" as const,
          title: "Check Unavailable",
          riskLevel: "medium" as const,
          value: "Could not evaluate",
          confidence: 20,
          icon: "clock",
          explanation: "This check could not be completed. Manual verification recommended.",
          whyItMatters: "Verify this aspect of the posting manually.",
          advice: ["Check this signal manually before proceeding."],
        };
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