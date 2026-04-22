import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimiter } from "./middlewares/rateLimiter";
import { requestTimeout } from "./middlewares/requestTimeout";
import { errorHandler } from "./middlewares/errorHandler";
import analyzeRouter from "./routes/analyze.route";

const app = express();

app.use(helmet());
app.set("trust proxy", 1);

const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ?? (process.env.NODE_ENV === "production" ? false : "*"),
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(rateLimiter);
app.use(requestTimeout);
app.use("/api", analyzeRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 404, message: "Route not found", code: "NOT_FOUND" });
});

app.use(errorHandler);

export default app;