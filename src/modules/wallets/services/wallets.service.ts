import { randomUUID } from "node:crypto";
import { injectable } from "tsyringe";
import { Transaction as KnexTransaction } from "objection";
import { WalletRepository } from "../repositories/wallets.repository";
import { LedgerRepository } from "../../ledgers/repositories/ledgers.repository";
import { TransactionRepository } from "../repositories/transactions.repository";
import { IdempotencyService } from "../../idempotency/idempotency.service";
import { Wallet } from "../models/wallet.model";
import { Transaction as TransactionModel, ITransaction } from "../models/transaction.model";
import NotFoundError from "../../../shared/error/not-found.error";
import InvalidRequestError from "../../../shared/error/invalid-request.error";
import { handleDbError } from "../../../shared/utils/db-error.util";
import { Money, gte, neg, normalize } from "../../../shared/utils/money";
import { DepositInput, WithdrawInput, TransferInput } from "../schemas/wallets.schema";

export interface DepositResult {
  walletId: string;
  balance: Money;
  transactionId: string;
}

export interface WithdrawResult {
  walletId: string;
  balance: Money;
  transactionId: string;
}

export interface TransferResult {
  fromWalletId: string;
  toWalletId: string;
  amount: Money;
  transactionId: string;
}

export interface BalanceResult {
  walletId: string;
  balance: Money;
}

@injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly idempotency: IdempotencyService,
  ) {}

  async deposit(userId: string, input: DepositInput, idempotencyKey: string) {
    return this.idempotency.run<DepositResult>(
      { key: idempotencyKey, userId, endpoint: "POST /wallets/deposit", requestBody: input },
      async () => {
        try {
          const result = await TransactionModel.transaction(async (trx) => {
            const wallet = await this.lockWallet(userId, trx);
            const transactionId = randomUUID();
            const amount = normalize(input.amount);

            await this.ledgerRepository.saveBulk(
              [{ id: randomUUID(), walletId: wallet.id, amount, type: "credit", reference: transactionId, transactionId }],
              trx,
            );

            await this.transactionRepository.save(
              {
                id: transactionId,
                type: "deposit",
                amount,
                fromUserId: null,
                toUserId: userId,
                status: "completed",
                idempotencyKey,
              } as Partial<ITransaction>,
              trx,
            );

            const balance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);
            return { walletId: wallet.id, balance, transactionId };
          });
          return { statusCode: 201, body: result };
        } catch (err) {
          handleDbError(err);
        }
      },
    );
  }

  async withdraw(userId: string, input: WithdrawInput, idempotencyKey: string) {
    return this.idempotency.run<WithdrawResult>(
      { key: idempotencyKey, userId, endpoint: "POST /wallets/withdraw", requestBody: input },
      async () => {
        try {
          const result = await TransactionModel.transaction(async (trx) => {
            const wallet = await this.lockWallet(userId, trx);
            const amount = normalize(input.amount);

            const balance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);
            if (!gte(balance, amount)) {
              throw new InvalidRequestError("Insufficient funds");
            }

            const transactionId = randomUUID();
            await this.ledgerRepository.saveBulk(
              [{ id: randomUUID(), walletId: wallet.id, amount: neg(amount), type: "debit", reference: transactionId, transactionId }],
              trx,
            );

            await this.transactionRepository.save(
              {
                id: transactionId,
                type: "withdrawal",
                amount,
                fromUserId: userId,
                toUserId: null,
                status: "completed",
                idempotencyKey,
              } as Partial<ITransaction>,
              trx,
            );

            const newBalance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);
            return { walletId: wallet.id, balance: newBalance, transactionId };
          });
          return { statusCode: 200, body: result };
        } catch (err) {
          handleDbError(err);
        }
      },
    );
  }

  async transfer(fromUserId: string, input: TransferInput, idempotencyKey: string) {
    if (fromUserId === input.toUserId) {
      throw new InvalidRequestError("Cannot transfer to your own wallet");
    }

    return this.idempotency.run<TransferResult>(
      { key: idempotencyKey, userId: fromUserId, endpoint: "POST /wallets/transfer", requestBody: input },
      async () => {
        try {
          const result = await TransactionModel.transaction(async (trx) => {
            const wallets = await this.walletRepository.lockWalletsByUserIds([fromUserId, input.toUserId], trx);
            const sender = wallets.find((w) => w.userId === fromUserId);
            const receiver = wallets.find((w) => w.userId === input.toUserId);
            if (!sender) throw new NotFoundError("Sender wallet not found");
            if (!receiver) throw new NotFoundError("Recipient wallet not found");

            const amount = normalize(input.amount);
            const senderBalance = await this.ledgerRepository.getBalanceByWalletId(sender.id, trx);
            if (!gte(senderBalance, amount)) {
              throw new InvalidRequestError("Insufficient funds");
            }

            const transactionId = randomUUID();
            await this.ledgerRepository.saveBulk(
              [
                { id: randomUUID(), walletId: sender.id, amount: neg(amount), type: "debit", reference: transactionId, transactionId },
                { id: randomUUID(), walletId: receiver.id, amount, type: "credit", reference: transactionId, transactionId },
              ],
              trx,
            );

            await this.transactionRepository.save(
              {
                id: transactionId,
                type: "transfer",
                amount,
                fromUserId,
                toUserId: input.toUserId,
                status: "completed",
                idempotencyKey,
              } as Partial<ITransaction>,
              trx,
            );

            return { fromWalletId: sender.id, toWalletId: receiver.id, amount, transactionId };
          });
          return { statusCode: 200, body: result };
        } catch (err) {
          handleDbError(err);
        }
      },
    );
  }

  async getBalance(userId: string): Promise<BalanceResult> {
    const wallet = await this.requireWallet(userId);
    const balance = await this.ledgerRepository.getBalanceByWalletId(wallet.id);
    return { walletId: wallet.id, balance };
  }

  async listTransactions(userId: string, limit: number, cursor?: { createdAt: string; id: string }) {
    await this.requireWallet(userId);
    const items = await this.transactionRepository.listForUser({ userId, limit, cursor });
    const last = items.at(-1);
    const nextCursor = items.length === limit && last ? { createdAt: last.createdAt, id: last.id } : null;
    return { items, nextCursor };
  }

  private async lockWallet(userId: string, trx: KnexTransaction): Promise<Wallet> {
    const wallet = await this.walletRepository.lockWalletByUserId(userId, trx);
    if (!wallet) throw new NotFoundError("Wallet not found");
    return wallet;
  }

  private async requireWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) throw new NotFoundError("Wallet not found");
    return wallet;
  }
}
