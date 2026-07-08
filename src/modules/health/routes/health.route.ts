import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { HealthController } from "../controllers/health.controller";

const healthRoute: FastifyPluginAsync = async (fastify) => {
  const controller = container.resolve(HealthController);
  fastify.get("/livez", controller.liveness);
  fastify.get("/readyz", controller.readiness);
};

export default healthRoute;
