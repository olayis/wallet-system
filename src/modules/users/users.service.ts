import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";

export async function createUser(
  fastify: FastifyInstance,
  email: string,
  password: string,
) {
  return fastify.db.transaction(async (trx) => {
    const userId = randomUUID();
    const walletId = randomUUID();

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    await trx("users").insert({
      id: userId,
      email,
      password_hash: passwordHash,
    });

    // Create wallet automatically
    await trx("wallets").insert({
      id: walletId,
      user_id: userId,
      balance: 0,
    });

    return { id: userId, email, wallet_id: walletId };
  });
}
