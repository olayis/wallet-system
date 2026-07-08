import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { Wallet } from "../models/wallet.model";

@injectable()
export class WalletRepository extends BaseRepository<Wallet> {
  constructor() {
    super(Wallet);
  }

  findByUserId(userId: string, trx?: Transaction): Promise<Wallet | undefined> {
    return this.findOne({ userId } as Partial<Wallet>, trx);
  }

  // ordering by id gives a stable lock acquisition order across concurrent transfers
  async lockWalletsByUserIds(userIds: string[], trx: Transaction): Promise<Wallet[]> {
    return await this.query(trx).whereIn("userId", userIds).orderBy("id").forUpdate();
  }

  async lockWalletByUserId(userId: string, trx: Transaction): Promise<Wallet | undefined> {
    return await this.query(trx).where({ userId }).forUpdate().first();
  }

  createWallet(id: string, userId: string, trx?: Transaction): Promise<Wallet> {
    return this.save({ id, userId } as Partial<Wallet>, trx);
  }
}
