import "fastify";
import "@fastify/jwt";
import { Knex } from "knex";

declare module "fastify" {
  interface FastifyInstance {
    db: Knex;
    authenticate: (req: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string; iat: number; exp: number };
  }
}

export {};
