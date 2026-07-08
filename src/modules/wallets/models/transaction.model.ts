import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import type { Money } from "../../../shared/utils/money";

export type TransactionType = "deposit" | "transfer" | "withdrawal";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export class Transaction extends Model {
  static override readonly tableName = DB_TABLES.TRANSACTIONS;

  id!: string;
  type!: TransactionType;
  amount!: Money;
  fromUserId!: string | null;
  toUserId!: string | null;
  status!: TransactionStatus;
  idempotencyKey!: string;
  createdAt!: string;
}

export type ITransaction = ModelObject<Transaction>;
