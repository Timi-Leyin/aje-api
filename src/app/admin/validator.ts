import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const loginSchema = zValidator(
  "json",
  z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
);
