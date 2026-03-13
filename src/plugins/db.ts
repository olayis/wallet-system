import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import knex, { Knex } from "knex";
import config from "../config/knex";

declare module "fastify" {
  interface FastifyInstance {
    db: Knex;
  }
}

async function dbPlugin(app: FastifyInstance) {
  const db = knex(config);

  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await db.destroy();
  });
}

export default fp(dbPlugin);
