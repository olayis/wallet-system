import { z } from "zod";

export const depositSchema = z.object({
  userId: z.uuid({ message: "Invalid User ID format" }),
  amount: z.number({ message: "Amount is required" }).positive({ message: "Amount must be a positive number" }),
});

export const transferSchema = z
  .object({
    fromUserId: z.uuid({ message: "Invalid Sender User ID format" }),
    toUserId: z.uuid({ message: "Invalid Recipient User ID format" }),
    amount: z.number({ message: "Amount is required" }).positive({ message: "Amount must be a positive number" }),
  })
  .refine((data) => data.fromUserId !== data.toUserId, {
    message: "Cannot transfer to the same wallet",
    path: ["toUserId"],
  });

export const getWalletBalanceSchema = z.object({
  userId: z.uuid({ message: "Invalid User ID format" }),
});

export type DepositRequest = z.infer<typeof depositSchema>;
export type TransferRequest = z.infer<typeof transferSchema>;
