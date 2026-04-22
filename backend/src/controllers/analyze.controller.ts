import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { analyzeJobPosting } from "../services/analyze.service";
import { saveFeedback, FeedbackVote } from "../db/analysisRepo";
import { AnalyzeRequestBody } from "../middlewares/validateRequest";
import { AppError } from "../types/AppError";
import pino from "pino";

const logger = pino({ name: "analyze-controller" });

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

    const result = await analyzeJobPosting(url);

    res.status(200).json({ ...result, requestId });
  } catch (error) {
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
    const { url, domain, riskScore, riskLevel, vote } = req.body as {
      url: string;
      domain: string;
      riskScore: number;
      riskLevel: string;
      vote: FeedbackVote;
    };

    if (!url || !domain || !vote || !["correct", "incorrect"].includes(vote)) {
      throw new AppError("Invalid feedback payload", 400, "INVALID_FEEDBACK");
    }

    saveFeedback(url, domain, riskScore, riskLevel, vote);
    reqLogger.info({ url, vote }, "feedback recorded");

    res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
}