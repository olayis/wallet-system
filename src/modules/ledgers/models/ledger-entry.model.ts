import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { Wallet } from "../../wallets/models/wallet.model";

export class LedgerEntry extends Model {
  static readonly tableName = DB_TABLES.LEDGER_ENTRIES;

  id: string;
  walletId: string;
  amount: number;
  type: string;
  reference: string;
  createdAt: string;

  static readonly relationMappings = {
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
