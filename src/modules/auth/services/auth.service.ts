import { randomUUID } from "node:crypto";
import { injectable } from "tsyringe";
import bcrypt from "bcrypt";
import { Model } from "objection";
import { UserRepository } from "../../users/repositories/users.repository";
import { WalletRepository } from "../../wallets/repositories/wallets.repository";
import UnauthorizedError from "../../../shared/error/unauthorized.error";
import { handleDbError } from "../../../shared/utils/db-error.util";
import appConfig from "../../../config/app.config";
import { LoginInput, RegisterInput } from "../schemas/auth.schema";

export interface AuthIdentity {
  id: string;
  email: string;
  walletId: string;
}

@injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthIdentity> {
    const passwordHash = await bcrypt.hash(input.password, appConfig.auth.bcryptCost);
    const userId = randomUUID();
    const walletId = randomUUID();

    try {
      return await Model.transaction(async (trx) => {
        await this.userRepository.createUser(userId, input.email.toLowerCase(), passwordHash, trx);
        await this.walletRepository.createWallet(walletId, userId, trx);
        return { id: userId, email: input.email.toLowerCase(), walletId };
      });
    } catch (err) {
      handleDbError(err, "Email already exists");
    }
  }

  async verifyCredentials(input: LoginInput): Promise<{ id: string; email: string }> {
    const user = await this.userRepository.findByEmail(input.email.toLowerCase());
    // hash comparison even on miss to keep timing roughly constant
    const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali";
    const ok = await bcrypt.compare(input.password, hash);
    if (!user || !ok) throw new UnauthorizedError("Invalid email or password");
    return { id: user.id, email: user.email };
  }
}
