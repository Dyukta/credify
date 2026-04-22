import "dotenv/config"; 
import pino from "pino";
import app from "./app";

const logger = pino({
  name: "credify-server",
  level: process.env.LOG_LEVEL ?? "info",
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});

const PORT = Number(process.env.PORT ?? 3001);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV ?? "development" }, "Credify server started");
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") logger.error({ port: PORT }, "Port already in use");
  else logger.error({ err }, "Server error");
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutdown started");
  server.close(() => { logger.info("Server closed"); process.exit(0); });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));

export default server;