import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dbNode } from "./setup";
import { deposit, registerUser } from "./helpers";

describe("idempotency", () => {
  it("replays the original response on repeat with the same key", async () => {
    const user = await registerUser();
    const key = randomUUID();

    const first = await deposit(user, "5000", key);
    const second = await deposit(user, "5000", key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);

    const ledger = await dbNode()("ledger_entries");
    expect(ledger.length).toBe(1);
  });

  it("400s when the same key is reused with a different body", async () => {
    const user = await registerUser();
    const key = randomUUID();

    const first = await deposit(user, "10", key);
    const second = await deposit(user, "20", key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(400);
  });

  it("does not leak idempotency keys across users", async () => {
    const a = await registerUser();
    const b = await registerUser();
    const key = randomUUID();

    const first = await deposit(a, "10", key);
    const second = await deposit(b, "10", key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it("rejects non-uuid idempotency keys", async () => {
    const user = await registerUser();
    const res = await deposit(user, "10", "not-a-uuid");
    expect(res.status).toBe(400);
  });
});
