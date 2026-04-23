import { Request, Response, NextFunction } from "express";

const TIMEOUT_MS = 35_000;

export function requestTimeout(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const controller = new AbortController();
  res.locals.abortController = controller;

  const timer = setTimeout(() => {
    controller.abort();

    if (!res.headersSent) {
      res.status(503).json({
        status: 503,
        message: "Request timed out. The target URL took too long to respond.",
        code: "REQUEST_TIMEOUT",
      });
    }
  }, TIMEOUT_MS);

  const clear = () => clearTimeout(timer);
  res.on("finish", clear);
  res.on("close", clear);

  next();
}