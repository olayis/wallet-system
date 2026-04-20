/// <reference path="./types/fastify.d.ts" />
import "reflect-metadata";
import "dotenv/config";
import "module-alias/register";

import fastify, { FastifyInstance } from "fastify";
import bootstrapApp from "./bootstrap";
import routes from "./shared/routes/index.routes";

class App {
  private fastify!: FastifyInstance;

  public async init() {
    this.fastify = fastify({ logger: true });

    bootstrapApp(this.fastify);
    this.registerModules();
    await this.fastify.ready();
    return this;
  }

  private registerModules() {
    this.fastify.register(routes.user);
    this.fastify.register(routes.wallet);
    this.fastify.register(routes.health);
  }

  public getInstance() {
    return this.fastify;
  }

  public async close() {
    await this.fastify.close();
  }

  public listen(port: number, address = "0.0.0.0") {
    return this.fastify.listen({ port, host: address });
  }
}

export default App;
