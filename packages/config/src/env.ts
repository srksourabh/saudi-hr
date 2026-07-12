import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://postgres:postgres@localhost:5432/hrms-app"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables");
    }
    return envSchema.parse({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hrms-app",
      AUTH_SECRET: "dev-secret-key-not-for-production-use-at-least-32-chars",
      REDIS_URL: "redis://localhost:6379",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "development",
    });
  }

  return parsed.data;
}

export const env = validateEnv();
