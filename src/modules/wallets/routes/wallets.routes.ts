import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { WalletController } from "../controllers/wallets.controller";
import validate from "../../../shared/middlewares/validator.middleware";
import { depositSchema, transferSchema, getWalletBalanceSchema } from "../schemas/wallets.schema";

const walletController = container.resolve(WalletController);

const walletRoute: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/wallets/deposit",
    preValidation: [validate(depositSchema)],
    handler: walletController.deposit,
  });

  fastify.route({
    method: "POST",
    url: "/wallets/transfer",
    preValidation: [validate(transferSchema)],
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
