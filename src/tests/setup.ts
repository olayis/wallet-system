import "reflect-metadata";
import { afterAll, beforeAll, beforeEach } from "vitest";
import App from "../app";
import { getKnexInstance } from "../db";

let serverInstance: App;

beforeAll(async () => {
  serverInstance = new App();
  await serverInstance.init();
});

afterAll(async () => {
  await serverInstance.close();
});

beforeEach(async () => {
  const db = getKnexInstance();
  await db("idempotency_keys").del();
  await db("ledger_entries").del();
  await db("transactions").del();
  await db("wallets").del();
  await db("users").del();
});

export const server = () => serverInstance;
export const dbNode = () => getKnexInstance();
