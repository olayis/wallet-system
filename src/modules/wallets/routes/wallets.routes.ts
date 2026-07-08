import { FastifyPluginAsync } from "fastify";
import { container } from "tsyringe";
import { WalletController } from "../controllers/wallets.controller";
import {
  depositBodySchema,
  withdrawBodySchema,
  idempotencyHeaderSchema,
  transactionListQuerySchema,
  transferBodySchema,
} from "../schemas/wallets.schema";

const walletRoute: FastifyPluginAsync = async (fastify) => {
  const controller = container.resolve(WalletController);

  fastify.post("/wallets/deposit", {
    onRequest: [fastify.authenticate],
    schema: { body: depositBodySchema, headers: idempotencyHeaderSchema },
    handler: controller.deposit,
  });

  fastify.post("/wallets/withdraw", {
    onRequest: [fastify.authenticate],
    schema: { body: withdrawBodySchema, headers: idempotencyHeaderSchema },
    handler: controller.withdraw,
  });

  fastify.post("/wallets/transfer", {
    onRequest: [fastify.authenticate],
    schema: { body: transferBodySchema, headers: idempotencyHeaderSchema },
    handler: controller.transfer,
  });

  fastify.get("/wallets/balance", {
    onRequest: [fastify.authenticate],
    handler: controller.getBalance,
  });

  fastify.get("/wallets/transactions", {
    onRequest: [fastify.authenticate],
    schema: { querystring: transactionListQuerySchema },
    handler: controller.listTransactions,
  });
};

export default walletRoute;
