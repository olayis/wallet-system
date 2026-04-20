import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;
