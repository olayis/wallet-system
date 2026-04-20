import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { server, dbNode } from "./setup";
import request from "supertest";
import { TEST_PASSWORD_HASH } from "../constants/testVariables";

const getTestServer = () => server();

it("should not duplicate transaction with same idempotency key", async () => {
  const userId = randomUUID();

  await dbNode()("users").insert({
    id: userId,
    email: "test@example.com",
    passwordHash: TEST_PASSWORD_HASH,
  });

  await dbNode()("wallets").insert({
    id: randomUUID(),
    userId: userId,
    balance: 0,
  });

  const key = randomUUID();

  await request(getTestServer().getInstance().server).post("/wallets/deposit").set("x-idempotency-key", key).send({
    userId,
    amount: 5000,
  });

  await request(getTestServer().getInstance().server).post("/wallets/deposit").set("x-idempotency-key", key).send({
    userId,
    amount: 5000,
  });

  const ledger = await dbNode()("ledger_entries");

  expect(ledger.length).toBe(1);
});
