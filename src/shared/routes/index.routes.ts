import authRoute from "../../modules/auth/routes/auth.route";
import walletRoute from "../../modules/wallets/routes/wallets.routes";
import healthRoute from "../../modules/health/routes/health.route";

export default {
  auth: authRoute,
  wallet: walletRoute,
  health: healthRoute,
};
