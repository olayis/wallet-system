import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import { HealthService } from "../services/health.service";
import { SuccessResponse, ErrorResponse } from "../../../shared/utils/response.util";

@injectable()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  liveness = async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = await this.healthService.checkLiveness();
    return reply.send(SuccessResponse("Service is alive", result));
  };

  readiness = async (_req: FastifyRequest, reply: FastifyReply) => {
    const result = await this.healthService.checkReadiness();
    if (result.status !== "ok") {
      return reply.status(503).send(ErrorResponse("Service degraded"));
    }
    return reply.send(SuccessResponse("Service is ready", result));
  };
}
