/// <reference path="./types/fastify.d.ts" />
import "reflect-metadata";
import Fastify, { FastifyInstance } from "fastify";
import dbPlugin from "./plugins/db";
import { IncomingMessage, Server, ServerResponse } from "node:http";
import routes from "./shared/routes/index.routes";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  await app.db.raw("SELECT 1");
  return { status: "ok" };
});

export default app;

class App {
  private readonly fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  constructor() {
    this.fastify = app;

    this.registerModules();
  }

  private registerModules() {
    this.fastify.register(dbPlugin);
    this.fastify.register(routes.user);
    this.fastify.register(routes.wallet);
  }
}
