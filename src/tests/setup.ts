import { beforeAll, afterAll, beforeEach } from "vitest";
import app from "../app";

let serverInstance: Awaited<ReturnType<typeof app.ready>>;

beforeAll(async () => {
  await app.ready();
  serverInstance = app;
});

export const server = () => serverInstance;

beforeEach(async () => {
  // Clean tables before each test
  await app.db("ledger_entries").del();
  await app.db("transactions").del();
  await app.db("wallets").del();
  await app.db("users").del();
  await app.db("idempotency_keys").del();
});

afterAll(async () => {
  await app.close();
});
