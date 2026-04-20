import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import { WalletService } from "../services/wallets.service";
import { SuccessResponse } from "../../../shared/utils/response.util";
import { DepositRequest, TransferRequest } from "../schemas/wallets.schema";

@injectable()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  deposit = async (req: FastifyRequest<{ Body: DepositRequest }>, res: FastifyReply) => {
    const key = req.headers["x-idempotency-key"] as string;

    const result = await this.walletService.depositToWallet(req.body, key);

    return res.status(httpStatus.CREATED).send(SuccessResponse("Deposit successful", result));
  };

  transfer = async (req: FastifyRequest<{ Body: TransferRequest }>, res: FastifyReply) => {
    const key = req.headers["x-idempotency-key"] as string;

    const result = await this.walletService.transferBetweenUsers(req.body, key);

    return res.status(httpStatus.OK).send(SuccessResponse("Transfer successful", result));
  };

  getBalance = async (req: FastifyRequest<{ Params: { userId: string } }>, res: FastifyReply) => {
    const { userId } = req.params;

    const result = await this.walletService.getWalletBalance(userId);

    return res.status(httpStatus.OK).send(SuccessResponse("Balance retrieved successfully", result));
  };
}
