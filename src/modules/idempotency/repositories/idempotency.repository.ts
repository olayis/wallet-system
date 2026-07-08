import { injectable } from "tsyringe";
import { Transaction } from "objection";
import { BaseRepository } from "../../../shared/repositories/base.repo";
import { IdempotencyKey } from "../models/idempotency-key.model";

export interface ClaimInput {
  id: string;
  userId: string;
  endpoint: string;
  requestHash: string;
}

@injectable()
export class IdempotencyRepository extends BaseRepository<IdempotencyKey> {
  constructor() {
    super(IdempotencyKey);
  }

  async claim(input: ClaimInput, trx?: Transaction): Promise<IdempotencyKey> {
    return (await this.query(trx)
      .insert({ ...input, state: "pending" })
      .returning("*")) as unknown as IdempotencyKey;
  }

  async complete(id: string, statusCode: number, responseBody: unknown, trx?: Transaction): Promise<void> {
    await this.query(trx).findById(id).patch({
      state: "completed",
      statusCode,
      responseBody,
      completedAt: new Date().toISOString(),
    } as Partial<IdempotencyKey>);
  }

  async release(id: string, trx?: Transaction): Promise<void> {
    await this.query(trx).deleteById(id);
  }
}
