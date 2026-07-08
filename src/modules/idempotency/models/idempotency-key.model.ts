import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export type IdempotencyState = "pending" | "completed";

export class IdempotencyKey extends Model {
  static override readonly tableName = DB_TABLES.IDEMPOTENCY_KEYS;

  id!: string;
  userId!: string;
  endpoint!: string;
  requestHash!: string;
  statusCode!: number | null;
  responseBody!: unknown;
  state!: IdempotencyState;
  createdAt!: string;
  completedAt!: string | null;
}

export type IIdempotencyKey = ModelObject<IdempotencyKey>;
