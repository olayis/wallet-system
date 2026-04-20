import { type Knex } from "knex";
import { knexSnakeCaseMappers } from "objection";
import appConfig from "./app.config";

const config: Knex.Config = {
  ...knexSnakeCaseMappers(),
  client: "pg",
  connection: {
    host: appConfig.database.host,
    port: appConfig.database.port,
    database: appConfig.database.name,
    user: appConfig.database.user,
    password: appConfig.database.password,
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
