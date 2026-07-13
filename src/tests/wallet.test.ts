import { describe, expect, it } from "vitest";
import { dbNode } from "./setup";
import { deposit, getBalance, registerUser } from "./helpers";

describe("wallet deposit & balance", () => {
  it("credits the wallet via the ledger", async () => {
    const user = await registerUser();

    const res = await deposit(user, "500.0000");
    expect(res.status).toBe(201);
    expect(res.body.data.balance).toBe("500.0000");

    const balance = await getBalance(user);
    expect(balance.body.data.balance).toBe("500.0000");

    const ledger = await dbNode()("ledger_entries");
    expect(ledger.length).toBe(1);
    expect(ledger[0].amount).toBe("500.0000");
    expect(ledger[0].type).toBe("credit");
  });

  it("rejects non-positive amounts", async () => {
    const user = await registerUser();
    const zero = await deposit(user, "0");
    const negative = await deposit(user, "-1");
    expect(zero.status).toBe(400);
    expect(negative.status).toBe(400);
  });

  it("rejects amounts with too many decimal places", async () => {
    const user = await registerUser();
    const res = await deposit(user, "1.123456");
    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric amount with 400, not 500", async () => {
    const user = await registerUser();
    for (const bad of ["abc", "$5", "   "]) {
      const res = await deposit(user, bad);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/numeric/i);
    }
  });

  it("does not lose precision on fractional deposits", async () => {
    const user = await registerUser();
    for (let i = 0; i < 10; i++) {
      const res = await deposit(user, "0.1");
      expect(res.status).toBe(201);
    }
    const balance = await getBalance(user);
    expect(balance.body.data.balance).toBe("1.0000");
  });
});
