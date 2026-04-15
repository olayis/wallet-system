import { injectable } from "tsyringe";
import { UserRepository } from "../repositories/users.repository";
import { WalletRepository } from "../../wallets/repositories/wallets.repository";
import { User } from "../models/user.model";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

@injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async createUser(email: string, password: string) {
    return await User.transaction(async (trx) => {
      const userId = randomUUID();

      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      await this.userRepository.createUser(userId, email, passwordHash, trx);

      const walletId = randomUUID();

      // Create wallet
      await this.walletRepository.createWallet(walletId, userId, trx);

      return { id: userId, email, wallet_id: walletId };
    });
  }
}
