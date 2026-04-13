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
}
