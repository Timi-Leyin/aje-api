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
