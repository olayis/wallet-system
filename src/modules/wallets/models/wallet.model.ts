import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { User } from "../../users/models/user.model";
import { Transaction } from "./transaction.model";
import { LedgerEntry } from "../../ledgers/models/ledger-entry.model";

export class Wallet extends Model {
  static readonly tableName = DB_TABLES.WALLETS;

  id: string;
  user_id: string;
  balance: number;
  created_at: string;

  static readonly relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => User,
      join: {
        from: `${DB_TABLES.WALLETS}.user_id`,
        to: `${DB_TABLES.USERS}.id`,
      },
    },
    transactions_from: {
      relation: Model.HasManyRelation,
      modelClass: () => Transaction,
      join: {
        from: `${DB_TABLES.WALLETS}.user_id`,
        to: `${DB_TABLES.TRANSACTIONS}.from_user_id`,
      },
    },
    transactions_to: {
      relation: Model.HasManyRelation,
      modelClass: () => Transaction,
      join: {
        from: `${DB_TABLES.WALLETS}.user_id`,
        to: `${DB_TABLES.TRANSACTIONS}.to_user_id`,
      },
    },
    ledger_entries: {
      relation: Model.HasManyRelation,
      modelClass: () => LedgerEntry,
      join: {
        from: `${DB_TABLES.WALLETS}.id`,
        to: `${DB_TABLES.LEDGER_ENTRIES}.wallet_id`,
      },
    },
  };
}

export type IWallet = ModelObject<Wallet>;
