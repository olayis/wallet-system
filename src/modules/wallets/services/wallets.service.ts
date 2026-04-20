import { injectable } from "tsyringe";
import { WalletRepository } from "../repositories/wallets.repository";
import { LedgerRepository } from "../../ledgers/repositories/ledgers.repository";
import { TransactionRepository } from "../repositories/transactions.repository";
import { Wallet } from "../models/wallet.model";
import { randomUUID } from "node:crypto";
import { Transaction } from "objection";
import NotFoundError from "../../../shared/error/not-found.error";
import InvalidRequestError from "../../../shared/error/invalid-request.error";
import DuplicateError from "../../../shared/error/duplicate.error";
import { DepositRequest, TransferRequest } from "../schemas/wallets.schema";

@injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async depositToWallet(data: DepositRequest, idempotencyKey?: string) {
    const { userId, amount } = data;

    try {
      return await Wallet.transaction(async (trx) => {
        const wallet = await this.getWalletByUserId(userId, trx);

        // Update Balance
        await this.walletRepository.incrementBalance(wallet.id, amount, trx);

        // Create Ledger Entry and Record Transaction
        const transactionId = randomUUID();

        await this.createLedgerEntries([{ wallet_id: wallet.id, amount, type: "credit" }], transactionId, trx);

        await this.recordTransaction(
          {
            id: transactionId,
            amount,
            to_user_id: userId,
            type: "deposit",
            status: "completed",
            idempotency_key: idempotencyKey,
          },
          trx,
        );

        const newBalance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);

        return { walletId: wallet.id, balance: newBalance };
      });
    } catch (err: any) {
      const errorCode = err.code || err?.nativeError?.code;

      if (err.name === "UniqueViolationError" || errorCode === "23505") {
        throw new DuplicateError("Request already processed.");
      }

      throw err;
    }
  }

  async transferBetweenUsers(data: TransferRequest, idempotencyKey?: string) {
    const { fromUserId, toUserId, amount } = data;

    if (fromUserId === toUserId) throw new InvalidRequestError("Cannot transfer to same wallet");

    try {
      return await Wallet.transaction(async (trx) => {
        // Lock both wallets in consistent order to prevent deadlocks
        const wallets = await this.walletRepository.lockWalletsByUserIds([fromUserId, toUserId], trx);

        const { sender, receiver } = this.getWalletsForTransfer(fromUserId, toUserId, wallets);

        // Check Balance from ledger
        const senderBalance = await this.ledgerRepository.getBalanceByWalletId(sender.id, trx);

        if (senderBalance < amount) throw new InvalidRequestError("Insufficient funds");

        await this.updateWalletsBalances(sender.id, receiver.id, amount, trx);

        // Create Ledger Entries and Record Transaction
        const transactionId = randomUUID();

        await this.createLedgerEntries(
          [
            { wallet_id: sender.id, amount: -amount, type: "debit" },
            { wallet_id: receiver.id, amount, type: "credit" },
          ],
          transactionId,
          trx,
        );

        await this.recordTransaction(
          {
            id: transactionId,
            amount,
            type: "transfer",
            from_user_id: fromUserId,
            to_user_id: toUserId,
            status: "completed",
            idempotency_key: idempotencyKey,
          },
          trx,
        );

        return {
          fromWalletId: sender.id,
          toWalletId: receiver.id,
          amount,
        };
      });
    } catch (err: any) {
      const errorCode = err.code || err?.nativeError?.code;

      if (err.name === "UniqueViolationError" || errorCode === "23505") {
        throw new DuplicateError("Request already processed.");
      }

      throw err;
    }
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);
    const balance = await this.ledgerRepository.getBalanceByWalletId(wallet.id);

    return { walletId: wallet.id, balance };
  }

  private async getWalletByUserId(userId: string, trx?: Transaction) {
    const findWallet = await this.walletRepository.findByUserId(userId, trx);

    if (!findWallet) throw new NotFoundError("Wallet not found");

    return findWallet;
  }

  private getWalletsForTransfer(fromUserId: string, toUserId: string, wallets: Wallet[]) {
    const sender = wallets.find((wallet) => wallet.user_id === fromUserId);
    const receiver = wallets.find((wallet) => wallet.user_id === toUserId);

    if (!sender) throw new NotFoundError("Sender wallet not found");
    if (!receiver) throw new NotFoundError("Receiver wallet not found");

    return { sender, receiver };
  }

  private async updateWalletsBalances(senderId: string, receiverId: string, amount: number, trx: Transaction) {
    await this.walletRepository.incrementBalance(senderId, -amount, trx);
    await this.walletRepository.incrementBalance(receiverId, amount, trx);
  }

  private async createLedgerEntries(
    entries: { wallet_id: string; amount: number; type: string }[],
    transactionId: string,
    trx: Transaction,
  ) {
    const formattedEntries = entries.map((entry) => ({
      ...entry,
      id: randomUUID(),
      reference: transactionId,
    }));

    await this.ledgerRepository.saveBulk(formattedEntries, trx);
  }

  private async recordTransaction(data: any, trx: Transaction) {
    await this.transactionRepository.save(data, trx);
  }
}
