import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
  redact: ["req.headers.authorization", "req.headers.cookie", "body.password"],
});
