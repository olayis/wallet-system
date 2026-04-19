import "reflect-metadata";
import { beforeAll, afterAll, beforeEach } from "vitest";
import App from "../app";
import { getKnexInstance } from "../database";

let serverInstance: App;

beforeAll(async () => {
  serverInstance = new App();
  await serverInstance.init();
});

export const server = () => serverInstance;

export const dbNode = () => getKnexInstance();

beforeEach(async () => {
  // Clean tables before each test
  const db = getKnexInstance();
  await db("ledger_entries").del();
  await db("transactions").del();
  await db("wallets").del();
  await db("users").del();
});

afterAll(async () => {
  await serverInstance.close();
});
