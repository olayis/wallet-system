import { injectable } from "tsyringe";
import { WalletRepository } from "../repositories/wallets.repository";
import { LedgerRepository } from "../../ledgers/repositories/ledgers.repository";
import { TransactionRepository } from "../repositories/transactions.repository";
import { Wallet } from "../models/wallet.model";
import { randomUUID } from "node:crypto";
import { Transaction as IKnexTransaction } from "objection";
import NotFoundError from "../../../shared/error/not-found.error";
import InvalidRequestError from "../../../shared/error/invalid-request.error";
import DuplicateError from "../../../shared/error/duplicate.error";
import { DepositRequest, TransferRequest } from "../schemas/wallets.schema";
import { ITransaction } from "../models/transaction.model";
import { handleDbError } from "@shared/utils/db-error.util";

@injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly ledgerRepository: LedgerRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async depositToWallet(data: DepositRequest, idempotencyKey: string) {
    const { userId, amount } = data;

    try {
      await this.validateIdempotency(idempotencyKey);

      return await Wallet.transaction(async (trx) => {
        const wallet = await this.getWalletByUserId(userId, trx);

        await this.walletRepository.incrementBalance(wallet.id, amount, trx);

        const transactionId = randomUUID();

        await this.recordFinancialEntries(
          { id: transactionId, amount, toUserId: userId, type: "deposit", status: "completed", idempotencyKey },
          [{ walletId: wallet.id, amount, type: "credit" }],
          trx,
        );

        const newBalance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);

        return { walletId: wallet.id, balance: newBalance };
      });
    } catch (err: any) {
      handleDbError(err);
      throw err;
    }
  }

  async transferBetweenUsers(data: TransferRequest, idempotencyKey: string) {
    const { fromUserId, toUserId, amount } = data;

    try {
      await this.validateTransferRules(data, idempotencyKey);

      return await Wallet.transaction(async (trx) => {
        const wallets = await this.walletRepository.lockWalletsByUserIds([fromUserId, toUserId], trx);

        const { sender, receiver } = this.getWalletsForTransfer(fromUserId, toUserId, wallets);

        await this.checkAvailableBalance(sender.id, amount, trx);

        await this.updateWalletsBalances(sender.id, receiver.id, amount, trx);

        const transactionId = randomUUID();

        await this.recordFinancialEntries(
          { id: transactionId, amount, type: "transfer", fromUserId, toUserId, status: "completed", idempotencyKey },
          [
            { walletId: sender.id, amount: -amount, type: "debit" },
            { walletId: receiver.id, amount, type: "credit" },
          ],
          transactionId,
          trx,
        );

        return { fromWalletId: sender.id, toWalletId: receiver.id, amount };
      });
    } catch (err: any) {
      handleDbError(err);
      throw err;
    }
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.getWalletByUserId(userId);
    const balance = await this.ledgerRepository.getBalanceByWalletId(wallet.id);

    return { walletId: wallet.id, balance };
  }

  private async getWalletByUserId(userId: string, trx?: IKnexTransaction) {
    const findWallet = await this.walletRepository.findByUserId(userId, trx);

    if (!findWallet) throw new NotFoundError("Wallet not found");

    return findWallet;
  }

  private getWalletsForTransfer(fromUserId: string, toUserId: string, wallets: Wallet[]) {
    const sender = wallets.find((wallet) => wallet.userId === fromUserId);
    const receiver = wallets.find((wallet) => wallet.userId === toUserId);

    if (!sender) throw new NotFoundError("Sender wallet not found");
    if (!receiver) throw new NotFoundError("Receiver wallet not found");

    return { sender, receiver };
  }

  private async checkAvailableBalance(senderId: string, transferAmount: number, trx: IKnexTransaction) {
    const balance = await this.ledgerRepository.getBalanceByWalletId(senderId, trx);

    if (balance < transferAmount) throw new InvalidRequestError("Insufficient funds");
  }

  private async updateWalletsBalances(senderId: string, receiverId: string, amount: number, trx: IKnexTransaction) {
    await this.walletRepository.incrementBalance(senderId, -amount, trx);
    await this.walletRepository.incrementBalance(receiverId, amount, trx);
  }

  private async validateTransferRules(data: TransferRequest, idempotencyKey: string) {
    if (data.fromUserId === data.toUserId) {
      throw new InvalidRequestError("Cannot transfer to same wallet");
    }
    await this.validateIdempotency(idempotencyKey);
  }

  private async validateIdempotency(key: string) {
    const existing = await this.transactionRepository.findByIdempotencyKey(key);
    if (existing) throw new DuplicateError("Request already processed.");
  }

  private async recordFinancialEntries(
    transactionData: Partial<ITransaction>,
    ledgerEntries: { walletId: string; amount: number; type: string }[],
    transactionIdOrTrx: string | IKnexTransaction,
    maybeTrx?: IKnexTransaction,
  ) {
    // Handle overloaded parameters from different flows
    const transactionId = typeof transactionIdOrTrx === "string" ? transactionIdOrTrx : (transactionData.id as string);
    const trx = typeof transactionIdOrTrx === "string" ? maybeTrx : transactionIdOrTrx;

    const formattedEntries = ledgerEntries.map((entry) => ({
      ...entry,
      id: randomUUID(),
      reference: transactionId,
    }));

    await this.ledgerRepository.saveBulk(formattedEntries, trx);
    await this.transactionRepository.save(transactionData, trx);
  }
}
