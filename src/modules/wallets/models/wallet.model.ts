import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { User } from "../../users/models/user.model";
import { Transaction } from "./transaction.model";
import { LedgerEntry } from "../../ledgers/models/ledger-entry.model";

export class Wallet extends Model {
  static override readonly tableName = DB_TABLES.WALLETS;

  id!: string;
  userId!: string;
  createdAt!: string;

  static override readonly relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: () => User,
      join: {
        from: `${DB_TABLES.WALLETS}.userId`,
        to: `${DB_TABLES.USERS}.id`,
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
  };
}

export type IWallet = ModelObject<Wallet>;
