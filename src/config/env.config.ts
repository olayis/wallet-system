import "dotenv/config";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
    APP_NAME: z.string().default("wallet_system"),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default("0.0.0.0"),

    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_NAME: z.string().min(1),
    DB_NAME_TEST: z.string().min(1).optional(),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().default(""),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
    JWT_TTL: z.string().default("1h"),

    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW: z.string().default("1 minute"),

    CORS_ORIGINS: z.string().default("*"),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "test" && !env.DB_NAME_TEST) {
      ctx.addIssue({
        code: "custom",
        path: ["DB_NAME_TEST"],
        message: "DB_NAME_TEST is required when NODE_ENV=test",
      });
    }
  });

export type AppEnv = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${formatted}`);
  process.exit(1);
}

export const env: AppEnv = parsed.data;
