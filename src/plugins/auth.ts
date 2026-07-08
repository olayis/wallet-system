import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import appConfig from "../config/app.config";

async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: appConfig.auth.jwtSecret,
    sign: { expiresIn: appConfig.auth.jwtTtl },
  });

  app.decorate("authenticate", async (req: FastifyRequest, _reply: FastifyReply) => {
    await req.jwtVerify();
  });
}

export default fp(authPlugin, { name: "auth" });
