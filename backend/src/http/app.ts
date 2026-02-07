import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "../env.js";
import { healthRouter } from "./routes/health.js";
import { devAuthRouter } from "./routes/devAuth.js";
import { workspaceRouter } from "./routes/workspaces.js";
import { channelRouter } from "./routes/channels.js";
import { voiceRouter } from "./routes/voice.js";

export function buildApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRouter);
  app.use("/api/dev", devAuthRouter);
  app.use("/api/workspaces", workspaceRouter);
  app.use("/api/channels", channelRouter);
  app.use("/api/voice", voiceRouter);

  return app;
}
