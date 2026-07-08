import { injectable } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import { WalletService } from "../services/wallets.service";
import { SuccessResponse } from "../../../shared/utils/response.util";
import { DepositInput, WithdrawInput, TransferInput, TransactionListQuery } from "../schemas/wallets.schema";
import InvalidRequestError from "../../../shared/error/invalid-request.error";

interface CursorPayload {
  createdAt: string;
  id: string;
}

function decodeCursor(cursor?: string): CursorPayload | undefined {
  if (!cursor) return undefined;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(json);
    if (typeof parsed?.createdAt === "string" && typeof parsed?.id === "string") return parsed;
  } catch {
    // do nothing
  }
  throw new InvalidRequestError("Invalid cursor");
}

function encodeCursor(c: CursorPayload | null): string | null {
  return c ? Buffer.from(JSON.stringify(c)).toString("base64url") : null;
}

@injectable()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  deposit = async (req: FastifyRequest<{ Body: DepositInput }>, reply: FastifyReply) => {
    const userId = req.user.sub;
    const key = req.headers["x-idempotency-key"] as string;

    const result = await this.walletService.deposit(userId, req.body, key);

    return reply.status(result.statusCode).send(SuccessResponse("Deposit successful", result.body));
  };

  withdraw = async (req: FastifyRequest<{ Body: WithdrawInput }>, reply: FastifyReply) => {
    const userId = req.user.sub;
    const key = req.headers["x-idempotency-key"] as string;

    const result = await this.walletService.withdraw(userId, req.body, key);

    return reply.status(result.statusCode).send(SuccessResponse("Withdrawal successful", result.body));
  };

  transfer = async (req: FastifyRequest<{ Body: TransferInput }>, reply: FastifyReply) => {
    const userId = req.user.sub;
    const key = req.headers["x-idempotency-key"] as string;

    const result = await this.walletService.transfer(userId, req.body, key);

    return reply.status(result.statusCode).send(SuccessResponse("Transfer successful", result.body));
  };

  getBalance = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user.sub;
    const result = await this.walletService.getBalance(userId);
    return reply.status(httpStatus.OK).send(SuccessResponse("Balance retrieved", result));
  };

  listTransactions = async (req: FastifyRequest<{ Querystring: TransactionListQuery }>, reply: FastifyReply) => {
    const userId = req.user.sub;
    const { limit, cursor } = req.query;
    const decoded = decodeCursor(cursor);

    const { items, nextCursor } = await this.walletService.listTransactions(userId, limit, decoded);

    return reply
      .status(httpStatus.OK)
      .send(SuccessResponse("Transactions retrieved", { items }, { nextCursor: encodeCursor(nextCursor) }));
  };
}
