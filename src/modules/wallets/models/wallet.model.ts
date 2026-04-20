import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { User } from "../../users/models/user.model";
import { Transaction } from "./transaction.model";
import { LedgerEntry } from "../../ledgers/models/ledger-entry.model";

export class Wallet extends Model {
  static readonly tableName = DB_TABLES.WALLETS;

  id: string;
  userId: string;
  balance: number;
  createdAt: string;

  static readonly relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => User,
      join: {
        from: `${DB_TABLES.WALLETS}.userId`,
        to: `${DB_TABLES.USERS}.id`,
      },
    },
    transactionsFrom: {
      relation: Model.HasManyRelation,
      modelClass: () => Transaction,
      join: {
        from: `${DB_TABLES.WALLETS}.userId`,
        to: `${DB_TABLES.TRANSACTIONS}.fromUserId`,
      },
    },
    transactionsTo: {
      relation: Model.HasManyRelation,
      modelClass: () => Transaction,
      join: {
        from: `${DB_TABLES.WALLETS}.userId`,
        to: `${DB_TABLES.TRANSACTIONS}.toUserId`,
      },
    },
    ledgerEntries: {
      relation: Model.HasManyRelation,
      modelClass: () => LedgerEntry,
      join: {
        from: `${DB_TABLES.WALLETS}.id`,
        to: `${DB_TABLES.LEDGER_ENTRIES}.walletId`,
      },
    },
  };
}

export type IWallet = ModelObject<Wallet>;
