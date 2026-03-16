import { FastifyInstance } from "fastify";
import { depositHandler, transferHandler } from "./wallets.controller";
import idempotencyPlugin from "../../plugins/idempotency";

export async function walletsRoutes(fastify: FastifyInstance) {
  fastify.post("/wallets/deposit", depositHandler);
  fastify
    .register(idempotencyPlugin)
    .post("/wallets/transfer", transferHandler);
}
