import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { Wallet } from "../models/wallet.model";

@injectable()
export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super(Wallet);
  }

  async findByUserId(userId: string, trx?: Transaction): Promise<Wallet | undefined> {
    return await this.findOne({ user_id: userId }, trx);
  }

  async lockWalletsByUserIds(userIds: string[], trx: Transaction): Promise<Wallet[]> {
    return await this.query(trx).whereIn("user_id", userIds).orderBy("id").forUpdate();
  }

  async updateBalance(walletId: string, newBalance: number, trx?: Transaction): Promise<Wallet> {
    return await this.updateById(walletId, { balance: newBalance }, trx);
  }

  async incrementBalance(walletId: string, amount: number, trx?: Transaction): Promise<void> {
    await this.query(trx)
      .findById(walletId)
      .patch({ balance: this.model.raw("balance + ?", [amount]) })
      .returning("*");
  }

  async createWallet(id: string, userId: string, trx?: Transaction): Promise<Wallet> {
    return await this.save({ id, user_id: userId, balance: 0 }, trx);
  }
}
