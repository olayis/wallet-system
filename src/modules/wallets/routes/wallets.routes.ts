import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { WalletController } from "../controllers/wallets.controller";

const walletController = container.resolve(WalletController);

const walletRoute: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/wallets/deposit",
    handler: walletController.deposit,
  });

  fastify.route({
    method: "POST",
    url: "/wallets/transfer",
    handler: walletController.transfer,
  });
};

export default walletRoute;
