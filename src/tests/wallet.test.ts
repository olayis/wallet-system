import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { server } from "./setup";
import request from "supertest";

const getTestServer = () => server();
const TEST_PASSWORD_HASH = process.env.TEST_PASSWORD_HASH || "test_hash_dev";

describe("Wallet System", () => {
  it("should deposit successfully", async () => {
    const userId = randomUUID();

    // Create User and Wallet
    await getTestServer().db.transaction(async (trx) => {
      await trx("users").insert({
        id: userId,
        email: "test@yopmail.com",
        password_hash: TEST_PASSWORD_HASH,
      });

      await trx("wallets").insert({
        id: randomUUID(),
        user_id: userId,
        balance: 0,
      });
    });

    const res = await request(getTestServer().server)
      .post("/wallets/deposit")
      .set("Idempotency-Key", randomUUID())
      .send({ user_id: userId, amount: 500 });

    expect(res.status).toBe(200);

    // Check ledger
    const ledger = await getTestServer().db("ledger_entries");

    expect(ledger.length).toBe(1);
    expect(Number(ledger[0].amount)).toBe(500);
  });
});
