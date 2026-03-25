import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { server } from "./setup";
import request from "supertest";
import { TEST_PASSWORD_HASH } from "../constants/testVariables";

const getTestServer = () => server();

it("should transfer between users", async () => {
  const userA = randomUUID();
  const userB = randomUUID();

  const walletA = randomUUID();
  const walletB = randomUUID();

  await getTestServer()
    .db("users")
    .insert([
      { id: userA, email: "a@yopmail.com", password_hash: TEST_PASSWORD_HASH },
      { id: userB, email: "b@yopmail.com", password_hash: TEST_PASSWORD_HASH },
    ]);

  // Create wallets for users
  await getTestServer()
    .db("wallets")
    .insert([
      { id: walletA, user_id: userA, balance: 0 },
      { id: walletB, user_id: userB, balance: 0 },
    ]);

  // Seed balance using ledger
  await getTestServer().db("ledger_entries").insert({
    id: randomUUID(),
    wallet_id: walletA,
    amount: 2000,
    type: "deposit",
    reference: randomUUID(),
  });

  const res = await request(getTestServer().server)
    .post("/wallets/transfer")
    .set("Idempotency-Key", randomUUID())
    .send({
      from_user_id: userA,
      to_user_id: userB,
      amount: 1000,
    });

  expect(res.status).toBe(200);

  const ledger = await getTestServer().db("ledger_entries");

  expect(ledger.length).toBe(3); // 1 deposit + 2 transfer entries
});
