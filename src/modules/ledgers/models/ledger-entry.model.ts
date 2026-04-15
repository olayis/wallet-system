import { Model } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export class LedgerEntry extends Model {
  static readonly tableName = DB_TABLES.LEDGER_ENTRIES;

  id: string;
  wallet_id: string;
  amount: number;
  type: string;
  reference: string;
  created_at: string;
}
