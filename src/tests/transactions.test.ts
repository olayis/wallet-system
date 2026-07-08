import { describe, expect, it } from "vitest";
import { deposit, listTxns, registerUser, transfer } from "./helpers";

describe("transaction history", () => {
  it("lists deposits and transfers in reverse chronological order", async () => {
    const a = await registerUser();
    const b = await registerUser();

    await deposit(a, "100");
    await deposit(a, "200");
    await transfer(a, b.id, "50");

    const res = await listTxns(a, { limit: 10 });
    expect(res.status).toBe(200);
    const types = res.body.data.items.map((i: { type: string }) => i.type);
    expect(types).toEqual(["transfer", "deposit", "deposit"]);
  });

  it("paginates with a cursor", async () => {
    const a = await registerUser();
    for (let i = 0; i < 5; i++) await deposit(a, "1");

    const first = await listTxns(a, { limit: 2 });
    expect(first.status).toBe(200);
    expect(first.body.data.items.length).toBe(2);
    expect(first.body.meta.nextCursor).toBeTruthy();

    const second = await listTxns(a, { limit: 2, cursor: first.body.meta.nextCursor });
    expect(second.status).toBe(200);
    expect(second.body.data.items.length).toBe(2);
    expect(second.body.data.items[0].id).not.toBe(first.body.data.items[0].id);
  });
});
