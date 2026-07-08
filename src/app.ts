import "reflect-metadata";
import "dotenv/config";
import "./types/fastify";

import { randomUUID } from "node:crypto";
import fastify, { FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { ZodError } from "zod";

import { loggerConfig } from "./config/logger.config";
import bootstrapApp from "./bootstrap";
import dbPlugin from "./plugins/db";
import securityPlugin from "./plugins/security";
import authPlugin from "./plugins/auth";
import routes from "./shared/routes/index.routes";
import AppError from "./shared/error/app.error";
import { ErrorCode } from "./shared/enums/error-code.enum";
import { ErrorResponse } from "./shared/utils/response.util";

class App {
  private fastify!: FastifyInstance;

  async init() {
    this.fastify = fastify({
      logger: loggerConfig,
      genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
      trustProxy: true,
      bodyLimit: 64 * 1024,
    }).withTypeProvider<ZodTypeProvider>();

    this.fastify.setValidatorCompiler(validatorCompiler);
    this.fastify.setSerializerCompiler(serializerCompiler);

    bootstrapApp(this.fastify);
    this.setErrorHandler();
    this.setNotFoundHandler();

    await this.fastify.register(dbPlugin);
    await this.fastify.register(securityPlugin);
    await this.fastify.register(authPlugin);

    await this.fastify.register(routes.auth);
    await this.fastify.register(routes.wallet);
    await this.fastify.register(routes.health);

    await this.fastify.ready();
    return this;
  }

  private setErrorHandler() {
    this.fastify.setErrorHandler((err, req, reply) => {
      if (hasZodFastifySchemaValidationErrors(err)) {
        const errors = err.validation.map((v) => ({
          field: v.instancePath.replace(/^\//, "").replaceAll("/", "."),
          message: v.message ?? "Invalid value",
        }));
        const message = errors[0]?.message ?? "Invalid request";
        req.log.info({ err }, "validation failed");
        return reply.status(400).send(ErrorResponse(message, ErrorCode.BAD_REQUEST, errors));
      }

      if (isResponseSerializationError(err)) {
        req.log.error({ err }, "response serialization failed");
        return reply.status(500).send(ErrorResponse("Internal serialization error", ErrorCode.GENERAL_ERROR));
      }

      if (err instanceof ZodError) {
        const errors = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
        return reply.status(400).send(ErrorResponse(errors[0]?.message ?? "Invalid request", ErrorCode.BAD_REQUEST, errors));
      }

      if (err instanceof AppError) {
        const log = err.statusCode >= 500 ? req.log.error : req.log.warn;
        log.call(req.log, { err }, err.message);
        return reply.status(err.statusCode).send(ErrorResponse(err.message, err.errorCode));
      }

      const status = (err as { statusCode?: number }).statusCode;
      if (status === 401) {
        return reply.status(401).send(ErrorResponse("Unauthorized", ErrorCode.UNAUTHORIZED));
      }
      if (status === 429) {
        return reply.status(429).send(ErrorResponse("Too many requests", ErrorCode.RATE_LIMITED));
      }

      req.log.error({ err }, "unhandled error");
      return reply.status(500).send(ErrorResponse("We are unable to process this request. Please try again.", ErrorCode.GENERAL_ERROR));
    });
  }

  private setNotFoundHandler() {
    this.fastify.setNotFoundHandler((_req, reply) => {
      return reply.status(404).send(ErrorResponse("Route not found", ErrorCode.NOT_FOUND));
    });
  }

  getInstance(): FastifyInstance | undefined {
    return this.fastify;
  }

  async close() {
    if (this.fastify) await this.fastify.close();
  }

  listen(port: number, host = "0.0.0.0") {
    return this.fastify.listen({ port, host });
  }
}

export default App;
