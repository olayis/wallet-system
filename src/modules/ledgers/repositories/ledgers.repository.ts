import { injectable } from "tsyringe";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { LedgerEntry } from "../models/ledger-entry.model";
import { Transaction } from "objection";

@injectable()
export class LedgerRepository extends BaseRepository<LedgerEntry> {
  constructor() {
    super(LedgerEntry);
  }

  async getBalanceByWalletId(walletId: string, trx?: Transaction): Promise<number> {
    const result = await this.query(trx).where({ wallet_id: walletId }).sum("amount as balance").first();

    return Number(result?.balance || 0);
  }
}
