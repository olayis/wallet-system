import { Model, ModelObject } from "objection";
import { DB_TABLES } from "../../../shared/enums/db-tables.enum";
import { Wallet } from "../../wallets/models/wallet.model";

export class User extends Model {
  static override readonly tableName = DB_TABLES.USERS;

  id!: string;
  email!: string;
  passwordHash!: string;
  createdAt!: string;

  static override readonly relationMappings = {
    wallet: {
      relation: Model.HasOneRelation,
      modelClass: () => Wallet,
      join: {
        from: `${DB_TABLES.USERS}.id`,
        to: `${DB_TABLES.WALLETS}.userId`,
      },
    },
  };
}

export type IUser = ModelObject<User>;
