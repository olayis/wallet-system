import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { http, registerUser } from "./helpers";

describe("validation messages", () => {
  it("reports each omitted field as '<field> is required'", async () => {
    const res = await http().post("/auth/register").send({});
    expect(res.status).toBe(400);
    const messages = res.body.errors.map((e: { message: string }) => e.message);
    expect(messages).toContain("email is required");
    expect(messages).toContain("password is required");
  });

  it("names the specific missing field", async () => {
    const missingEmail = await http().post("/auth/register").send({ password: "a-good-password" });
    expect(missingEmail.body.message).toBe("email is required");

    const missingPassword = await http().post("/auth/register").send({ email: "user@example.com" });
    expect(missingPassword.body.message).toBe("password is required");
  });

  it("keeps the specific message when a value is present but invalid", async () => {
    const res = await http().post("/auth/register").send({ email: "not-an-email", password: "a-good-password" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid email address");
  });

  it("applies to money and header fields too", async () => {
    const user = await registerUser();

    const noAmount = await http()
      .post("/wallets/deposit")
      .set("authorization", `Bearer ${user.token}`)
      .set("x-idempotency-key", randomUUID())
      .send({});
    expect(noAmount.status).toBe(400);
    expect(noAmount.body.message).toBe("amount is required");

    const noKey = await http()
      .post("/wallets/deposit")
      .set("authorization", `Bearer ${user.token}`)
      .send({ amount: "10" });
    expect(noKey.status).toBe(400);
    const messages = noKey.body.errors.map((e: { message: string }) => e.message);
    expect(messages).toContain("x-idempotency-key is required");
  });
});
