import { injectable } from "tsyringe";
import { WalletService } from "../services/wallets.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { depositSchema, transferSchema } from "../schemas/wallets.schema";

@injectable()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  deposit = async (req: FastifyRequest, res: FastifyReply) => {
    const key = req.headers["idempotency-key"] as string;

    const { user_id, amount } = req.body as { user_id: string; amount: number };

    const result = await this.walletService.depositToWallet(user_id, amount, key);

    return res.status(200).send(result);
  };

  transfer = async (req: FastifyRequest, res: FastifyReply) => {
    const key = req.headers["idempotency-key"] as string;

    const { from_user_id, to_user_id, amount } = req.body as {
      from_user_id: string;
      to_user_id: string;
      amount: number;
    };

    const result = await this.walletService.transferBetweenUsers(from_user_id, to_user_id, amount, key);

    return res.status(200).send(result);
  };
}
