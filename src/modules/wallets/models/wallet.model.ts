import { Model } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export class Wallet extends Model {
  static tableName = DB_TABLES.WALLETS;

  id: string;
  user_id: string;
  balance: number;
  created_at: string;
}
