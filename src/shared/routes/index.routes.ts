import userRoute from "../../modules/users/routes/users.route";
import walletRoute from "../../modules/wallets/routes/wallets.routes";
import healthRoute from "../../modules/health/routes/health.route";

export default {
  user: userRoute,
  wallet: walletRoute,
  health: healthRoute,
};
