import crypto from "node:crypto";
import { injectable } from "tsyringe";
import { IdempotencyRepository } from "./repositories/idempotency.repository";
import DuplicateError from "../../shared/error/duplicate.error";
import InvalidRequestError from "../../shared/error/invalid-request.error";
import { handleDbError } from "../../shared/utils/db-error.util";

export interface IdempotencyContext {
  key: string;
  userId: string;
  endpoint: string;
  requestBody: unknown;
}

export interface ReplayResult<T> {
  replayed: boolean;
  statusCode: number;
  body: T;
}

export type Handler<T> = () => Promise<{ statusCode: number; body: T }>;

@injectable()
export class IdempotencyService {
  constructor(private readonly repo: IdempotencyRepository) {}

  hash(body: unknown): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(body ?? {}))
      .digest("hex");
  }

  async run<T>(ctx: IdempotencyContext, handler: Handler<T>): Promise<ReplayResult<T>> {
    const requestHash = this.hash(ctx.requestBody);

    const existing = await this.repo.findById(ctx.key);
    if (existing) {
      return this.handleExisting<T>(existing, ctx.endpoint, requestHash, ctx.userId);
    }

    try {
      await this.repo.claim({ id: ctx.key, userId: ctx.userId, endpoint: ctx.endpoint, requestHash });
    } catch (err) {
      const after = await this.repo.findById(ctx.key);
      if (after) return this.handleExisting<T>(after, ctx.endpoint, requestHash, ctx.userId);
      handleDbError(err);
    }

    let result: { statusCode: number; body: T };
    try {
      result = await handler();
    } catch (err) {
      // the handler's own DB transaction rolled back, so release the key and let a retry run fresh
      await this.repo.release(ctx.key).catch(() => undefined);
      throw err;
    }

    await this.repo.complete(ctx.key, result.statusCode, result.body as unknown);
    return { replayed: false, ...result };
  }

  private handleExisting<T>(
    record: {
      userId: string;
      endpoint: string;
      requestHash: string;
      state: string;
      statusCode: number | null;
      responseBody: unknown;
    },
    endpoint: string,
    requestHash: string,
    userId: string,
  ): ReplayResult<T> {
    if (record.userId !== userId) throw new DuplicateError("Idempotency key already used");
    if (record.endpoint !== endpoint || record.requestHash !== requestHash) {
      throw new InvalidRequestError("Idempotency key reused with a different request");
    }
    if (record.state === "pending") throw new DuplicateError("Request already in progress");

    return {
      replayed: true,
      statusCode: record.statusCode ?? 200,
      body: record.responseBody as T,
    };
  }
}
