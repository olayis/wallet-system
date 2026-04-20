import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { WalletController } from "../controllers/wallets.controller";
import validate from "../../../shared/middlewares/validator.middleware";
import { depositSchema, transferSchema, getWalletBalanceSchema, idempotencyHeaderSchema } from "../schemas/wallets.schema";

const walletController = container.resolve(WalletController);

const walletRoute: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/wallets/deposit",
    preValidation: [validate(depositSchema), validate(idempotencyHeaderSchema, "headers")],
    handler: walletController.deposit,
  });

  fastify.route({
    method: "POST",
    url: "/wallets/transfer",
    preValidation: [validate(transferSchema), validate(idempotencyHeaderSchema, "headers")],
    handler: walletController.transfer,
  });

  fastify.route({
    method: "GET",
    url: "/wallets/:userId/balance",
    preValidation: [validate(getWalletBalanceSchema, "params")],
    handler: walletController.getBalance,
  });
};

export default walletRoute;
