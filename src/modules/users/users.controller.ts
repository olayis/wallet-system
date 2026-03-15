import { FastifyReply, FastifyRequest } from "fastify";
import { createUser } from "./users.service";
import { createUserSchema } from "./users.schema";

export async function createUserHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { email, password } = createUserSchema.parse(request.body);

    const user = await createUser(request.server, email, password);

    return reply.code(201).send(user);
  } catch (err: any) {
    if (err.code === "23505") {
      return reply
        .code(409)
        .send({ error: "Email already exists", details: err.detail });
    }

    if (err?.name === "ZodError") {
      return reply
        .code(400)
        .send({ error: "Invalid request", issues: err.errors });
    }

    // fallback
    request.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
}
