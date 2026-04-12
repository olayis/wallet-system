import { Model } from "objection";
import { DB_TABLES } from "../../enums/db-tables.enum";

export class IdempotencyKey extends Model {
  static tableName = DB_TABLES.IDEMPOTENCY_KEYS;

  id: string;
  endpoint: string;
  response?: string;
  completed: string;
  created_at: string;
}
