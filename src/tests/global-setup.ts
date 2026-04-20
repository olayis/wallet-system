import "dotenv/config";
import Knex from "knex";
import config from "../config/knex";

export async function setup() {
  console.log("--- Running Global Test Database Setup ---");
  const db = Knex(config);

  try {
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
    console.log("--- Schema reset and migrations completed successfully ---");
  } catch (error) {
    console.error("--- Global Setup Error:", error);
    throw error;
  } finally {
    await db.destroy();
  }
}

export async function teardown() {
  console.log("--- Global Test Database Teardown ---");
}
