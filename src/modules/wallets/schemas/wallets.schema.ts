import { z } from "zod";

export const depositSchema = z.object({
  user_id: z.uuid(),
  amount: z.number().positive(),
});

export const transferSchema = z
  .object({
    from_user_id: z.uuid(),
    to_user_id: z.uuid(),
    amount: z.number().positive(),
  })
  .refine((data) => data.from_user_id !== data.to_user_id, {
    message: "Cannot transfer to same wallet",
    path: ["to_user_id"],
  });
