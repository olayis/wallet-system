import { Model } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export class Transaction extends Model {
  static tableName = DB_TABLES.TRANSACTIONS;

  id: string;
  type: string;
  amount: number;
  from_user_id?: string;
  to_user_id?: string;
  status: string;
  created_at: string;
}
