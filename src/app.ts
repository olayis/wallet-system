import Fastify from "fastify";
import dbPlugin from "./plugins/db";

const app = Fastify({
  logger: true,
});

app.register(dbPlugin);

app.get("/health", async () => {
  await app.db.raw("SELECT 1");
  return { status: "ok" };
});

export default app;
