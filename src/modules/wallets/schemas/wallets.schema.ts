import { z } from "zod";
import { moneySchema } from "../../../shared/utils/money";
import { requiredAware } from "../../../config/validation.config";

export const idempotencyHeaderSchema = z.object({
  "x-idempotency-key": z.uuid({ error: requiredAware("x-idempotency-key must be a valid UUID") }),
});

export const depositBodySchema = z.object({
  amount: moneySchema,
});

export const withdrawBodySchema = z.object({
  amount: moneySchema,
});

export const transferBodySchema = z.object({
  toUserId: z.uuid({ error: requiredAware("Invalid recipient user id") }),
  amount: moneySchema,
});

export const transactionListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});

export const transactionListReplySchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["deposit", "transfer", "withdrawal"]),
        amount: z.string(),
        fromUserId: z.string().nullable(),
        toUserId: z.string().nullable(),
        status: z.string(),
        createdAt: z.string(),
      }),
    ),
  }),
  meta: z
    .object({
      nextCursor: z.string().nullable(),
    })
    .optional(),
});

export type DepositInput = z.infer<typeof depositBodySchema>;
export type WithdrawInput = z.infer<typeof withdrawBodySchema>;
export type TransferInput = z.infer<typeof transferBodySchema>;
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>;
