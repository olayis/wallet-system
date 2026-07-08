import { injectable } from "tsyringe";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { Transaction } from "../models/transaction.model";

export interface TransactionListFilter {
  userId: string;
  limit: number;
  cursor?: { createdAt: string; id: string };
}

@injectable()
export class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(Transaction);
  }

  async listForUser({ userId, limit, cursor }: TransactionListFilter): Promise<Transaction[]> {
    const qb = this.query()
      .where((b) => b.where({ fromUserId: userId }).orWhere({ toUserId: userId }))
      .orderBy("createdAt", "desc")
      .orderBy("id", "desc")
      .limit(limit);

    if (cursor) {
      qb.where((b) =>
        b
          .where("createdAt", "<", cursor.createdAt)
          .orWhere((b2) => b2.where("createdAt", cursor.createdAt).andWhere("id", "<", cursor.id)),
      );
    }

    return await qb;
  }
}
