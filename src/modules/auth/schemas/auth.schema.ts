import { z } from "zod";
import { requiredAware } from "../../../config/validation.config";

export const registerSchema = z.object({
  email: z.email({ error: requiredAware("Invalid email address") }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
});

export const loginSchema = z.object({
  email: z.email({ error: requiredAware("Invalid email address") }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
