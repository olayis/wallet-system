import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { User } from "../models/user.model";

@injectable()
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  findByEmail(email: string, trx?: Transaction): Promise<User | undefined> {
    return this.findOne({ email } as Partial<User>, trx);
  }

  createUser(id: string, email: string, passwordHash: string, trx?: Transaction): Promise<User> {
    return this.save({ id, email, passwordHash } as Partial<User>, trx);
  }
}
