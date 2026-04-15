import { injectable } from "tsyringe";
import { UserService } from "../services/users.service";
import { FastifyReply, FastifyRequest } from "fastify";

@injectable()
export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const { email, password } = req.body as { email: string; password: string };

      const user = await this.userService.createUser(email, password);

      return res.code(201).send(user);
    } catch (err: any) {
      if (err.code === "23505") {
        return res.code(409).send({ error: "Email already exists", details: err.detail });
      }

      if (err?.name === "ZodError") {
        return res.code(400).send({ error: "Invalid request", issues: err.errors });
      }

      // fallback
      req.log.error(err);
      return res.code(500).send({ error: "Internal server error" });
    }
  };
}
