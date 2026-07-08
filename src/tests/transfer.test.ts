import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dbNode } from "./setup";
import { deposit, getBalance, registerUser, transfer } from "./helpers";

describe("wallet transfer", () => {
  it("transfers between users and produces 3 ledger rows (deposit + debit + credit)", async () => {
    const a = await registerUser();
    const b = await registerUser();

    await deposit(a, "2000.0000");

    const res = await transfer(a, b.id, "750.5000");
    expect(res.status).toBe(200);

    const ledger = await dbNode()("ledger_entries");
    expect(ledger.length).toBe(3);

    const balA = await getBalance(a);
    const balB = await getBalance(b);
    expect(balA.body.data.balance).toBe("1249.5000");
    expect(balB.body.data.balance).toBe("750.5000");
  });

  it("rejects insufficient funds", async () => {
    const a = await registerUser();
    const b = await registerUser();
    await deposit(a, "10");
    const res = await transfer(a, b.id, "11");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient/i);
  });

  it("rejects self-transfer", async () => {
    const a = await registerUser();
    await deposit(a, "100");
    const res = await transfer(a, a.id, "1");
    expect(res.status).toBe(400);
  });

  it("404s when recipient does not exist", async () => {
    const a = await registerUser();
    await deposit(a, "100");
    const res = await transfer(a, randomUUID(), "1");
    expect(res.status).toBe(404);
  });

  it("survives concurrent reciprocal transfers without deadlock", async () => {
    const a = await registerUser();
    const b = await registerUser();
    await deposit(a, "1000");
    await deposit(b, "1000");

    const results = await Promise.all([transfer(a, b.id, "100"), transfer(b, a.id, "100")]);
    for (const r of results) expect(r.status).toBe(200);

    const balA = await getBalance(a);
    const balB = await getBalance(b);
    expect(balA.body.data.balance).toBe("1000.0000");
    expect(balB.body.data.balance).toBe("1000.0000");
  });
});
