import { FastifyInstance } from "fastify";
import {
  balanceHandler,
  depositHandler,
  transferHandler,
} from "./wallets.controller";
import idempotencyPlugin from "../../plugins/idempotency";

export async function walletsRoutes(fastify: FastifyInstance) {
  await fastify.register(async (instance) => {
    await instance.register(idempotencyPlugin);
    instance.post("/wallets/deposit", depositHandler);
    instance.post("/wallets/transfer", transferHandler);
  });
  fastify.get("/wallets/:id/balance", balanceHandler);
}
