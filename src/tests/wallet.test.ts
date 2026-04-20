import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import request from "supertest";
import httpStatus from "http-status";
import { server, dbNode } from "./setup";
import { TEST_PASSWORD_HASH } from "../constants/testVariables";

const getTestServer = () => server();

describe("Wallet System", () => {
  it("should deposit successfully", async () => {
    const userId = randomUUID();

    // Create User and Wallet
    await dbNode().transaction(async (trx) => {
      await trx("users").insert({
        id: userId,
        email: "test@yopmail.com",
        passwordHash: TEST_PASSWORD_HASH,
      });

      await trx("wallets").insert({
        id: randomUUID(),
        userId: userId,
        balance: 0,
      });
    });

    const res = await request(getTestServer().getInstance().server)
      .post("/wallets/deposit")
      .set("x-idempotency-key", randomUUID())
      .send({ userId, amount: 500 });

    expect(res.status).toBe(httpStatus.CREATED);

    // Check ledger
    const ledger = await dbNode()("ledger_entries");

    expect(ledger.length).toBe(1);
    expect(Number(ledger[0].amount)).toBe(500);
  });
});
