import type { FastifyServerOptions } from "fastify";
import appConfig from "./app.config";

const isDev = appConfig.app.env === "development";
const isTest = appConfig.app.env === "test";

export const loggerConfig: FastifyServerOptions["logger"] = isTest
  ? false
  : {
      level: appConfig.log.level,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['x-idempotency-key']",
          "req.body.password",
          "req.body.passwordHash",
          "*.password",
          "*.passwordHash",
        ],
        censor: "[redacted]",
      },
      ...(isDev
        ? {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, singleLine: true, translateTime: "SYS:HH:MM:ss" },
            },
          }
        : {}),
    };
