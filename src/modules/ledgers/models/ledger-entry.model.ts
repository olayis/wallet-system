import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { Wallet } from "../../wallets/models/wallet.model";
import type { Money } from "../../../shared/utils/money";

export type LedgerEntryType = "credit" | "debit";

export class LedgerEntry extends Model {
  static override readonly tableName = DB_TABLES.LEDGER_ENTRIES;

  id!: string;
  walletId!: string;
  amount!: Money;
  type!: LedgerEntryType;
  reference!: string;
  transactionId!: string | null;
  createdAt!: string;

  static override readonly relationMappings = {
    wallet: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => Wallet,
      join: {
        from: `${DB_TABLES.LEDGER_ENTRIES}.walletId`,
        to: `${DB_TABLES.WALLETS}.id`,
      },
    },
  };
}

export type ILedgerEntry = ModelObject<LedgerEntry>;
