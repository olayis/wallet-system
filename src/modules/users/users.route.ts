import { FastifyInstance } from "fastify";
import { createUserHandler } from "./users.controller";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.post("/users", createUserHandler);
}
