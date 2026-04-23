import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { analyzeJobPosting } from "../services/analyze.service";
import { saveFeedback } from "../db/analysisRepo";
import { AnalyzeRequestBody } from "../middlewares/validateRequest";
import { AppError } from "../types/AppError";
import pino from "pino";

const logger = pino({ name: "analyze-controller" });

const feedbackSchema = z.object({
  url:z.string().url(),
  domain:z.string().min(1),
  riskScore:z.number().int().min(0).max(100),
  riskLevel:z.enum(["low", "medium", "high"]),
  vote:z.enum(["correct", "incorrect"])
});

export async function analyzeController(
  req: Request<object, object, AnalyzeRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = randomUUID();
  const reqLogger = logger.child({ requestId });

  try {
    const { url } = req.body;
    reqLogger.info({ url }, "analyze request received");

    const abortSignal = (res.locals.abortController as AbortController | undefined)?.signal;
    const result = await analyzeJobPosting(url, abortSignal);

    if (res.headersSent) return;
    res.status(200).json({ ...result, requestId });
  } catch (error) {
    if (res.headersSent) return;
    reqLogger.warn({ error }, "analyze request failed");
    res.locals.requestId = requestId;
    next(error);
  }
}

export async function feedbackController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = randomUUID();
  const reqLogger = logger.child({ requestId });

  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        "Invalid feedback payload",
        400,
        "INVALID_FEEDBACK"
      );
    }

    const { url, domain, riskScore, riskLevel, vote } = parsed.data;
    saveFeedback(url, domain, riskScore, riskLevel, vote);
    reqLogger.info({ url, vote }, "feedback recorded");

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}