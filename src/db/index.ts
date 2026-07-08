import Knex, { Knex as IKnex } from "knex";
import { Model } from "objection";
import config from "../config/knex";

let knexInstance: IKnex | null = null;

export default function initializeDatabase(): IKnex {
  if (!knexInstance) {
    knexInstance = Knex(config);
    Model.knex(knexInstance);
  }
  return knexInstance;
}

export function getKnexInstance(): IKnex {
  if (!knexInstance) throw new Error("Database has not been initialized");
  return knexInstance;
}
