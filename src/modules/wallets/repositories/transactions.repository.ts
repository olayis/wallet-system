import { injectable } from "tsyringe";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { Transaction } from "../models/transaction.model";

@injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(Transaction);
  }
}
