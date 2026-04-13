/// <reference path="./types/fastify.d.ts" />
import Fastify from "fastify";
import dbPlugin from "./plugins/db";
import { usersRoutes } from "./modules/users/users.route";
import walletRoute from "./modules/wallets/routes/wallets.routes";

const app = Fastify({
  logger: true,
});

app.register(dbPlugin);
app.register(usersRoutes);
app.register(walletRoute);

app.get("/health", async () => {
  await app.db.raw("SELECT 1");
  return { status: "ok" };
});

export default app;
