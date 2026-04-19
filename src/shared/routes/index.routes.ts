import userRoute from "../../modules/users/routes/users.route";
import walletRoute from "../../modules/wallets/routes/wallets.routes";

export default {
  user: userRoute,
  wallet: walletRoute,
  health: healthRoute,
};
