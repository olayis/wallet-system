import { injectable } from "tsyringe";
import { WalletRepository } from "../repositories/wallets.repository";
import { LedgerRepository } from "../../ledgers/repositories/ledgers.repository";
import { TransactionRepository } from "../repositories/transactions.repository";
import { Wallet } from "../models/wallet.model";
import { randomUUID } from "node:crypto";

@injectable()
export class WalletService {
  constructor(
    private walletRepository: WalletRepository,
    private ledgerRepository: LedgerRepository,
    private transactionRepository: TransactionRepository,
  ) {}

  async depositToWallet(userId: string, amount: number) {
    return await Wallet.transaction(async (trx) => {
      const wallet = await this.walletRepository.findByUserId(userId, trx);

      if (!wallet) throw new Error("Wallet not found");

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
      await this.transactionRepository.save({
        amount,
        id: transactionId,
        to_user_id: userId,
        type: "deposit",
        status: "completed",
      });

      const newBalance = await this.ledgerRepository.getBalanceByWalletId(wallet.id, trx);

      return { wallet_id: wallet.id, balance: newBalance };
    });
  }

  async transferBetweenUsers(fromUserId: string, toUserId: string, amount: number) {
    return await Wallet.transaction(async (trx) => {
      // Lock both wallets in consistent order to prevent deadlocks
      const wallets = await this.walletRepository.lockWalletsByUserIds([fromUserId, toUserId], trx);

      const sender = wallets.find((wallet) => wallet.user_id === fromUserId);
      const receiver = wallets.find((wallet) => wallet.user_id === toUserId);

      if (!sender) throw new Error("Sender wallet not found");
      if (!receiver) throw new Error("Receiver wallet not found");

      // Check Balance from ledger
      const senderBalance = await this.ledgerRepository.getBalanceByWalletId(sender.id, trx);

      if (senderBalance < amount) throw new Error("Insufficient funds");

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

      return {
        from_wallet_id: sender.id,
        to_wallet_id: receiver.id,
        amount,
      };
    });
  }
}
