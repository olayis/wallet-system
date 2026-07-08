import { env } from "./env.config";

const isTest = env.NODE_ENV === "test";

const appConfig = {
  app: {
    name: env.APP_NAME,
    env: env.NODE_ENV,
  },
  server: {
    port: env.PORT,
    host: env.HOST,
  },
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: isTest ? (env.DB_NAME_TEST ?? env.DB_NAME) : env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtTtl: env.JWT_TTL,
    bcryptCost: env.BCRYPT_COST,
  },
  log: {
    level: env.LOG_LEVEL,
  },
  http: {
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      timeWindow: env.RATE_LIMIT_WINDOW,
    },
    corsOrigins: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
  },
};

export default appConfig;
