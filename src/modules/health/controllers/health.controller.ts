import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import HealthService from "../services/health.service";
import { SuccessResponse } from "../../../shared/utils/response.util";

@injectable()
class HealthController {
  constructor(private readonly healthService: HealthService) {}

  readinessCheck = async (req: FastifyRequest, res: FastifyReply) => {
    const result = this.healthService.checkHealth();

    res.send(SuccessResponse("Service is ready", result));
  };

  livelinessCheck = async (req: FastifyRequest, res: FastifyReply) => {
    res.send(SuccessResponse("Service is alive"));
  };
}

export default HealthController;
