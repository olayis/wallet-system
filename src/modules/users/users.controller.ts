import { FastifyReply, FastifyRequest } from "fastify";
import { createUser } from "./users.service";

export async function createUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { email, password } = request.body as any;

  const user = await createUser(request.server, email, password);

  return reply.code(201).send(user);
}
