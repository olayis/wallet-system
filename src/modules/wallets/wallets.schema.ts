import { z } from "zod";

export const depositSchema = z.object({
  user_id: z.uuid(),
  amount: z.number().positive(),
});

export const transferSchema = z.object({
  from_user_id: z.uuid(),
  to_user_id: z.uuid(),
  amount: z.number().positive(),
});
