import { injectable } from "tsyringe";
import { BaseRepository } from "../../repositories/base.repo";
import { IdempotencyKey } from "../models/idempotency-key.model";

@injectable()
export class IdempotencyRepository extends BaseRepository<IdempotencyKey> {
  constructor() {
    super(IdempotencyKey);
  }
}
