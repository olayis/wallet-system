import { FastifyInstance } from "fastify";
import { depositHandler, transferHandler } from "./wallets.controller";

export async function walletsRoutes(fastify: FastifyInstance) {
  fastify.post("/wallets/deposit", depositHandler);
  fastify.post("/wallets/transfer", transferHandler);
}
