import { container } from "tsyringe";
import { UserController } from "../controllers/users.controller";
import { FastifyPluginAsync } from "fastify";
import validate from "../../../shared/middlewares/validator.middleware";
import { createUserSchema } from "../schemas/users.schema";

const userController = container.resolve(UserController);

const userRoute: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/users",
    preValidation: [validate(createUserSchema)],
    handler: userController.create,
  });
};

export default userRoute;
