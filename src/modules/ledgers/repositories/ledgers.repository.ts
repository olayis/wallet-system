import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { LedgerEntry } from "../models/ledger-entry.model";
import type { Money } from "../../../shared/utils/money";
import { normalize } from "../../../shared/utils/money";

@injectable()
export class LedgerRepository extends BaseRepository<LedgerEntry> {
  constructor() {
    super(LedgerEntry);
  }

  async getBalanceByWalletId(walletId: string, trx?: Transaction): Promise<Money> {
    const result = await this.query(trx).where({ walletId }).sum("amount as balance").first();
    const raw = (result as { balance?: string | null } | undefined)?.balance;
    return normalize(raw ?? "0");
  }
}
