import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const signUpValidator = zValidator(
  "json",
  z.object({
    firstName: z.string(),
    lastName: z.string(),
    password: z.string(),
    phone: z.string(),
    email: z.string(),
    // # Related to db/schema.ts
    userType: z.enum(["buyer", "agent", "vendor", "artisan"]),
  })
);

export const loginValidator = zValidator(
  "json",
  z.object({
    email: z.string(),
    password: z.string(),
  })
);

export const forgotPasswordValidator = zValidator(
  "json",
  z.object({
    email: z.string().email("Invalid email address"),
  })
);

export const resetPasswordValidator = zValidator(
  "json",
  z.object({
    token: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
);
