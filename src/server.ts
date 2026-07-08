import App from "./app";
import appConfig from "./config/app.config";

const app = new App();

let shuttingDown = false;

async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const log = app.getInstance()?.log;
  log?.info({ signal }, "shutting down");
  try {
    await app.close();
    process.exit(exitCode);
  } catch (err) {
    log?.error({ err }, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
  shutdown("uncaughtException", 1);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
  shutdown("unhandledRejection", 1);
});

app
  .init()
  .then((initialized) => initialized.listen(appConfig.server.port, appConfig.server.host))
  .then((address) => {
    app.getInstance()?.log.info(`${appConfig.app.name} listening on ${address}`);
  })
  .catch((err) => {
    console.error("failed to start", err);
    process.exit(1);
  });
