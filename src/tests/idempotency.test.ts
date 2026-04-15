import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { server } from "./setup";
import request from "supertest";
import { TEST_PASSWORD_HASH } from "../constants/testVariables";

const getTestServer = () => server();

it("should not duplicate transaction with same idempotency key", async () => {
  const userId = randomUUID();

  await getTestServer().db("users").insert({
    id: userId,
    email: "test@example.com",
    password_hash: TEST_PASSWORD_HASH,
  });

  await getTestServer().db("wallets").insert({
    id: randomUUID(),
    user_id: userId,
    balance: 0,
  });

  const key = randomUUID();

  await request(getTestServer().server).post("/wallets/deposit").set("Idempotency-Key", key).send({
    user_id: userId,
    amount: 5000,
  });

  await request(getTestServer().server).post("/wallets/deposit").set("Idempotency-Key", key).send({
    user_id: userId,
    amount: 5000,
  });

  const ledger = await getTestServer().db("ledger_entries");

  expect(ledger.length).toBe(1);
});
