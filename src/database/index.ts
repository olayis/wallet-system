import Knex, { Knex as IKnex } from "knex";
import { Model } from "objection";
import config from "../config/knex";

let knexInstance: IKnex;

export default function initializeDatabase() {
  knexInstance = Knex(config);

  Model.knex(knexInstance);
}

export function getKnexInstance(): IKnex {
  return knexInstance;
}
