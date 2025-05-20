import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const loginSchema = zValidator(
  "json",
  z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
);

export const updateUserSchema = zValidator(
  "json",
  z.object({
    email: z.string().email().optional(),
    first_name: z.string().min(2).optional(),
    last_name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    verified: z.boolean().optional(),
    verification_status: z.enum(["pending", "verified", "rejected"]).optional(),
    password: z.string().min(6).optional(),
    user_type: z
      .enum(["buyer", "agent", "vendor", "artisan", "admin"])
      .optional(),
    bio: z.string().optional(),
    services: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    available: z.boolean().optional(),
    subscription_id: z.string().optional(),
  })
);
