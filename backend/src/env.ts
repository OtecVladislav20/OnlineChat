import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  MONGO_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  LIVEKIT_URL: z.string().min(1).default("http://localhost:7880"),
  LIVEKIT_API_KEY: z.string().min(1).optional(),
  LIVEKIT_API_SECRET: z.string().min(32).optional()
});

export const env = envSchema.parse(process.env);
