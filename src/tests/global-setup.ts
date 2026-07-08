import "dotenv/config";
import { register } from "ts-node";
import Knex from "knex";
import config from "../config/knex";

// knex loads the .ts migration files through a plain require(), so register a
// TypeScript loader before migrating. Node versions without native type
// stripping (the CI runner) cannot parse them otherwise.
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
