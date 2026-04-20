import App from "./app";
import appConfig from "./config/app.config";

const app = new App();

process
  .on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    app.close();
    process.exit(1);
  })
  .on("SIGINT", () => {
    app.close();
    process.exit(0);
  });

app
  .init()
  .then((initializedApp) => initializedApp.listen(appConfig.server.port))
  .then((address) => console.info(`${appConfig.app.name} started on ${address}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
