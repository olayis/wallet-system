import type { FastifyInstance } from "fastify";
import initializeDatabase from "./db";

export default function bootstrapApp(_fastify: FastifyInstance) {
  initializeDatabase();
}
