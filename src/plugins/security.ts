import fp from "fastify-plugin";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import appConfig from "../config/app.config";

async function securityPlugin(app: FastifyInstance) {
  await app.register(helmet, { global: true });

  const origins = appConfig.http.corsOrigins;
  await app.register(cors, {
    origin: origins.includes("*") ? true : origins,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: appConfig.http.rateLimit.max,
    timeWindow: appConfig.http.rateLimit.timeWindow,
    keyGenerator: (req) => {
      const auth = (req.headers.authorization ?? "").toString();
      return auth ? `auth:${auth.slice(-32)}` : (req.ip ?? "anon");
    },
  });
}

export default fp(securityPlugin, { name: "security" });
