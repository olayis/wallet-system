import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { AuthController } from "../controllers/auth.controller";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const authRoute: FastifyPluginAsync = async (fastify) => {
  const controller = container.resolve(AuthController);

  fastify.post("/auth/register", { schema: { body: registerSchema }, handler: controller.register });
  fastify.post("/auth/login", { schema: { body: loginSchema }, handler: controller.login });
};

export default authRoute;
