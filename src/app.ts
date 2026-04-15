/// <reference path="./types/fastify.d.ts" />
import "reflect-metadata";
import Fastify from "fastify";
import dbPlugin from "./plugins/db";
import userRoute from "./modules/users/routes/users.route";
import walletRoute from "./modules/wallets/routes/wallets.routes";

const app = Fastify({
  logger: true,
});

app.register(dbPlugin);
app.register(userRoute);
app.register(walletRoute);

app.get("/health", async () => {
  await app.db.raw("SELECT 1");
  return { status: "ok" };
});

export default app;
