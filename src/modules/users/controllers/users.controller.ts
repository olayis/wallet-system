import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import { UserService } from "../services/users.service";
import { SuccessResponse } from "../../../shared/utils/response.util";
import { CreateUserRequest } from "../schemas/users.schema";

@injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: FastifyRequest<{ Body: CreateUserRequest }>, res: FastifyReply) => {
    const user = await this.userService.createUser(req.body);
    return res.code(httpStatus.CREATED).send(SuccessResponse("User created successfully", user));
  };
}
