import { type Knex } from "knex";
import { knexSnakeCaseMappers } from "objection";
import pgTypes from "pg-types";
import appConfig from "./app.config";

// keep numeric as string so money never round-trips through IEEE-754
pgTypes.setTypeParser(pgTypes.builtins.NUMERIC, (val) => val);
pgTypes.setTypeParser(pgTypes.builtins.INT8, (val) => val);

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
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./src/db/migrations",
    extension: "ts",
    loadExtensions: [".ts"],
  },
  seeds: {
    directory: "./src/db/seeds",
    extension: "ts",
  },
};

export default config;
