import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dbNode } from "./setup";
import { deposit, getBalance, registerUser, withdraw } from "./helpers";

describe("wallet withdraw", () => {
  it("debits the wallet via the ledger", async () => {
    const user = await registerUser();
    await deposit(user, "500.0000");

    const res = await withdraw(user, "200.0000");
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe("300.0000");

    const balance = await getBalance(user);
    expect(balance.body.data.balance).toBe("300.0000");

    const ledger = await dbNode()("ledger_entries").orderBy("created_at");
    expect(ledger.length).toBe(2);
    expect(ledger[1].amount).toBe("-200.0000");
    expect(ledger[1].type).toBe("debit");
  });

  it("rejects insufficient funds", async () => {
    const user = await registerUser();
    await deposit(user, "50");
    const res = await withdraw(user, "51");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  it("replays the original response on repeat with the same key", async () => {
    const user = await registerUser();
    await deposit(user, "500");
    const key = randomUUID();

    const first = await withdraw(user, "100", key);
    const second = await withdraw(user, "100", key);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);

    const balance = await getBalance(user);
    expect(balance.body.data.balance).toBe("400.0000");
  });

  it("blocks withdrawals without a token", async () => {
    const res = await withdraw({ token: "" } as never, "10");
    expect(res.status).toBe(401);
  });
});
