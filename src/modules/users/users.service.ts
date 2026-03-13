import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { FastifyInstance } from "fastify";

export async function createUser(
  fastify: FastifyInstance,
  email: string,
  password: string,
) {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await fastify.db("users").insert({
    id,
    email,
    password_hash: passwordHash,
  });

  return { id, email };
}
