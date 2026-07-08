import { describe, expect, it } from "vitest";
import { http, registerUser } from "./helpers";

describe("auth", () => {
  it("registers a new user, creates wallet, returns token", async () => {
    const user = await registerUser();
    expect(user.id).toBeDefined();
    expect(user.token).toBeDefined();
    expect(user.walletId).toBeDefined();
  });

  it("rejects duplicate email", async () => {
    const user = await registerUser();
    const res = await http().post("/auth/register").send({ email: user.email, password: "another-pass" });
    expect(res.status).toBe(409);
  });

  it("rejects weak passwords", async () => {
    const res = await http()
      .post("/auth/register")
      .send({ email: "weak@example.com", password: "short" });
    expect(res.status).toBe(400);
  });

  it("logs in with valid credentials", async () => {
    const password = "this-is-fine-1234";
    const user = await registerUser({ password });
    const res = await http().post("/auth/login").send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  it("rejects invalid credentials with 401", async () => {
    const user = await registerUser();
    const res = await http().post("/auth/login").send({ email: user.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("blocks wallet endpoints without a token", async () => {
    const res = await http().get("/wallets/balance");
    expect(res.status).toBe(401);
  });
});
