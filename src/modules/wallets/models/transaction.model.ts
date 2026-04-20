import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export class Transaction extends Model {
  static readonly tableName = DB_TABLES.TRANSACTIONS;

  id: string;
  type: string;
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  status: string;
  idempotencyKey?: string;
  createdAt: string;
}

export type ITransaction = ModelObject<Transaction>;
