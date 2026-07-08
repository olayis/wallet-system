import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import { AuthService } from "../services/auth.service";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { SuccessResponse } from "../../../shared/utils/response.util";

@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
    const identity = await this.authService.register(req.body);
    const token = await reply.jwtSign({ sub: identity.id });
    return reply
      .status(httpStatus.CREATED)
      .send(SuccessResponse("User registered", { user: identity, token }));
  };

  login = async (req: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
    const identity = await this.authService.verifyCredentials(req.body);
    const token = await reply.jwtSign({ sub: identity.id });
    return reply
      .status(httpStatus.OK)
      .send(SuccessResponse("Login successful", { user: identity, token }));
  };
}
