import AppError from "./shared/error/app.error";
import { ErrorResponse } from "./shared/utils/response.util";
import initializeDatabase from "./database";
import { FastifyInstance } from "fastify";

function bootstrapApp(fastify: FastifyInstance) {
  initializeDatabase();

  setErrorHandler(fastify);
}

function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((err: any, request, reply) => {
    const statusCode = err.statusCode || 500;
    const message = err instanceof AppError ? err.message : "We are unable to process this request. Please try again.";

    request.log.error(err);

    return reply.status(statusCode).send(ErrorResponse(message));
  });
}

export default bootstrapApp;
