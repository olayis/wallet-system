import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { User } from "../models/user.model";

@injectable()
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async createUser(id: string, email: string, passwordHash: string, trx?: Transaction): Promise<User> {
    return await this.save({ id, email, passwordHash }, trx);
  }
}
