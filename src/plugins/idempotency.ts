import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";

const idempotencyPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorateRequest("idempotency-key");

  fastify.addHook("preHandler", async (request, reply) => {
    const key = request.headers["idempotency-key"];

    if (!key) {
      return reply.status(400).send({ error: "Missing Idempotency-Key" });
    }

    const endpoint = request.url;

    // Check existing key
    const existingKey = await fastify
      .db("idempotency_keys")
      .where({ id: key, endpoint })
      .first();

    if (existingKey?.completed) {
      return reply.send(existingKey.response);
    }

    if (!existingKey) {
      await fastify.db("idempotency_keys").insert({
        id: key,
        endpoint,
        completed: false,
      });
    }
  });
});

export default idempotencyPlugin;
