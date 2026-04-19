import { getEnv } from "./env.config";

const appConfig = {
  app: {
    name: process.env.APP_NAME,
    env: getEnv(),
  },
  server: {
    port: Number(process.env.PORT),
  },
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};

export default appConfig;
