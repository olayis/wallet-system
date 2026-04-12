import { Model } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";

export class User extends Model {
  static tableName = DB_TABLES.USERS;

  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}
