import { injectable } from "tsyringe";
import { WalletRepository } from "../repositories/wallets.repository";
import { LedgerRepository } from "../../ledgers/repositories/ledgers.repository";
import { TransactionRepository } from "../repositories/transactions.repository";
import { Wallet } from "../models/wallet.model";
import { randomUUID } from "node:crypto";
import { IdempotencyRepository } from "../../../shared/idempotency/repositories/idempotency.repository";
import { Transaction } from "objection";
import NotFoundError from "../../../shared/error/not-found.error";
import InvalidRequestError from "../../../shared/error/invalid-request.error";
import { DepositRequest, TransferRequest } from "../schemas/wallets.schema";

@injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly idempotencyRepository: IdempotencyRepository,
  ) {}

  async depositToWallet(data: DepositRequest, idempotencyKey?: string) {
    const { userId, amount } = data;

    return await Wallet.transaction(async (trx) => {
      const wallet = await this.getWalletByUserId(userId, trx);

      const transactionId = randomUUID();

      // Update Balance
      await this.walletRepository.incrementBalance(wallet.id, amount, trx);

      // Create Ledger Entry
      await this.ledgerRepository.save(
        {
          amount,
          id: randomUUID(),
          wallet_id: wallet.id,
          type: "deposit",
          reference: transactionId,
        },
        trx,
      );

      // Record Transaction
      await this.transactionRepository.save(
        {
          amount,
          id: transactionId,
          to_user_id: userId,
          type: "deposit",
          status: "completed",
        },
        trx,
      );

      const newBalance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);

      const result = { walletId: wallet.id, balance: newBalance };

      if (idempotencyKey) await this.trackIdempotency(idempotencyKey, result, trx);

      return result;
    });
  }

  async transferBetweenUsers(data: TransferRequest, idempotencyKey?: string) {
    const { fromUserId, toUserId, amount } = data;

    if (fromUserId === toUserId) throw new InvalidRequestError("Cannot transfer to same wallet");

    return await Wallet.transaction(async (trx) => {
      // Lock both wallets in consistent order to prevent deadlocks
      const wallets = await this.walletRepository.lockWalletsByUserIds([fromUserId, toUserId], trx);

      const sender = wallets.find((wallet) => wallet.user_id === fromUserId);
      const receiver = wallets.find((wallet) => wallet.user_id === toUserId);

      if (!sender) throw new NotFoundError("Sender wallet not found");
      if (!receiver) throw new NotFoundError("Receiver wallet not found");

      // Check Balance from ledger
      const senderBalance = await this.ledgerRepository.getBalanceByWalletId(sender.id, trx);

      if (senderBalance < amount) throw new InvalidRequestError("Insufficient funds");

      const transactionId = randomUUID();

      // Update Ledger Entries
      await this.ledgerRepository.saveBulk(
        [
          {
            id: randomUUID(),
            wallet_id: sender.id,
            amount: -amount,
            type: "transfer",
            reference: transactionId,
          },
          {
            id: randomUUID(),
            wallet_id: receiver.id,
            amount,
            type: "transfer",
            reference: transactionId,
          },
        ],
        trx,
      );

      // Record transaction
      await this.transactionRepository.save(
        {
          id: transactionId,
          type: "transfer",
          amount,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          status: "completed",
        },
        trx,
      );

      const result = {
        fromWalletId: sender.id,
        toWalletId: receiver.id,
        amount,
      };

      if (idempotencyKey) await this.trackIdempotency(idempotencyKey, result, trx);

      return result;
    });
  }

  private async getWalletByUserId(userId: string, trx: Transaction) {
    const findWallet = await this.walletRepository.findByUserId(userId, trx);

    if (!findWallet) throw new NotFoundError("Wallet not found");

    return findWallet;
  }

  private async trackIdempotency(idempotencyKey: string, result: any, trx: Transaction) {
    await this.idempotencyRepository.updateById(
      idempotencyKey,
      {
        completed: true,
        response: JSON.stringify(result),
      },
      trx,
    );
  }
}
