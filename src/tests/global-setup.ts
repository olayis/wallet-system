import "dotenv/config";
import { register } from "ts-node";
import Knex from "knex";
import config from "../config/knex";

register({ transpileOnly: true });

export async function setup() {
  const db = Knex(config);
  try {
    await db.raw("DROP SCHEMA public CASCADE");
    await db.raw("CREATE SCHEMA public");
    await db.migrate.latest();
  } finally {
    await db.destroy();
  }
}

export async function teardown() {}
