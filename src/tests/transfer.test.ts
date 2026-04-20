import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import request from "supertest";
import httpStatus from "http-status";
import { server, dbNode } from "./setup";
import { TEST_PASSWORD_HASH } from "../constants/testVariables";

const getTestServer = () => server();

it("should transfer between users", async () => {
  const userA = randomUUID();
  const userB = randomUUID();

  const walletA = randomUUID();
  const walletB = randomUUID();

  await dbNode()("users").insert([
    { id: userA, email: "a@yopmail.com", passwordHash: TEST_PASSWORD_HASH },
    { id: userB, email: "b@yopmail.com", passwordHash: TEST_PASSWORD_HASH },
  ]);

  // Create wallets for users
  await dbNode()("wallets").insert([
    { id: walletA, userId: userA, balance: 0 },
    { id: walletB, userId: userB, balance: 0 },
  ]);

  // Seed balance using ledger
  await dbNode()("ledger_entries").insert({
    id: randomUUID(),
    walletId: walletA,
    amount: 2000,
    type: "credit",
    reference: randomUUID(),
  });

  const res = await request(getTestServer().getInstance().server)
    .post("/wallets/transfer")
    .set("x-idempotency-key", randomUUID())
    .send({
      fromUserId: userA,
      toUserId: userB,
      amount: 1000,
    });

  expect(res.status).toBe(httpStatus.OK);

  const ledger = await dbNode()("ledger_entries");

  expect(ledger.length).toBe(3); // 1 deposit + 2 transfer entries
});
