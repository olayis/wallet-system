import { injectable } from "tsyringe";
import { WalletService } from "../services/wallets.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { depositSchema, transferSchema } from "../schemas/wallets.schema";

@injectable()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  deposit = async (req: FastifyRequest, res: FastifyReply) => {
    const key = req.headers["idempotency-key"] as string;

    const { user_id, amount } = depositSchema.parse(req.body);

    const result = await this.walletService.depositToWallet(user_id, amount, key);

    return res.status(200).send(result);
  };

  transfer = async (req: FastifyRequest, res: FastifyReply) => {
    const key = req.headers["idempotency-key"] as string;

    const { from_user_id, to_user_id, amount } = transferSchema.parse(req.body);

    if (from_user_id === to_user_id) return res.status(400).send({ error: "Cannot transfer to same wallet" });

    const result = await this.walletService.transferBetweenUsers(from_user_id, to_user_id, amount, key);

    return res.status(200).send(result);
  };
}
