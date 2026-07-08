import request from "supertest";
import { randomUUID } from "node:crypto";
import { server } from "./setup";

export interface TestUser {
  id: string;
  email: string;
  token: string;
  walletId: string;
}

export const http = () => {
  const instance = server().getInstance();
  if (!instance) throw new Error("Server not initialized");
  return request(instance.server);
};

export async function registerUser(overrides: Partial<{ email: string; password: string }> = {}): Promise<TestUser> {
  const email = overrides.email ?? `u_${randomUUID()}@example.com`;
  const password = overrides.password ?? "correct horse battery staple";

  const res = await http().post("/auth/register").send({ email, password });
  if (res.status !== 201) throw new Error(`registerUser failed: ${res.status} ${res.text}`);
  return {
    id: res.body.data.user.id,
    email: res.body.data.user.email,
    walletId: res.body.data.user.walletId,
    token: res.body.data.token,
  };
}

export async function deposit(user: TestUser, amount: string | number, key: string = randomUUID()) {
  return http()
    .post("/wallets/deposit")
    .set("authorization", `Bearer ${user.token}`)
    .set("x-idempotency-key", key)
    .send({ amount });
}

export async function withdraw(user: TestUser, amount: string | number, key: string = randomUUID()) {
  return http()
    .post("/wallets/withdraw")
    .set("authorization", `Bearer ${user.token}`)
    .set("x-idempotency-key", key)
    .send({ amount });
}

export async function transfer(
  from: TestUser,
  toUserId: string,
  amount: string | number,
  key: string = randomUUID(),
) {
  return http()
    .post("/wallets/transfer")
    .set("authorization", `Bearer ${from.token}`)
    .set("x-idempotency-key", key)
    .send({ toUserId, amount });
}

export async function getBalance(user: TestUser) {
  return http().get("/wallets/balance").set("authorization", `Bearer ${user.token}`);
}

export async function listTxns(user: TestUser, query: Record<string, string | number> = {}) {
  return http().get("/wallets/transactions").query(query).set("authorization", `Bearer ${user.token}`);
}
