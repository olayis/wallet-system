import { injectable } from "tsyringe";
import { UserRepository } from "../repositories/users.repository";
import { WalletRepository } from "../../wallets/repositories/wallets.repository";
import { User } from "../models/user.model";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { CreateUserRequest } from "../schemas/users.schema";
import { handleDbError } from "../../../shared/utils/db-error.util";

@injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async createUser(data: CreateUserRequest) {
    try {
      const { email, password } = data;

      return await User.transaction(async (trx) => {
        // Create user
        const userId = randomUUID();

        const passwordHash = await bcrypt.hash(password, 10);

        await this.userRepository.createUser(userId, email, passwordHash, trx);

        // Create wallet
        const walletId = randomUUID();

        await this.walletRepository.createWallet(walletId, userId, trx);

        return { id: userId, email, walletId };
      });
    } catch (err: any) {
      handleDbError(err, "Email already exists");
      throw err;
    }
  }
}
