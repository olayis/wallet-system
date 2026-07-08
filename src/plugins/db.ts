import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { getKnexInstance } from "../db";

async function dbPlugin(app: FastifyInstance) {
  const db = getKnexInstance();

  app.decorate("db", db);

  app.addHook("onClose", async () => {
    await db.destroy();
  });
}

export default fp(dbPlugin, { name: "db" });
