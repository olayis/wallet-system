import type { Knex } from "knex";
import { env } from "./src/config/env";

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
  },
  seeds: {
    directory: "./src/db/seeds",
    extension: "ts",
  },
};

export default config;
