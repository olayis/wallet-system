import Fastify from "fastify";
import dbPlugin from "./plugins/db";
import { usersRoutes } from "./modules/users/users.routes";
import { walletsRoutes } from "./modules/wallets/wallets.routes";

const app = Fastify({
  logger: true,
});

app.register(dbPlugin);
app.register(usersRoutes);
app.register(walletsRoutes);

app.get("/health", async () => {
  await app.db.raw("SELECT 1");
  return { status: "ok" };
});

export default app;
