import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const updateProfileValidator = zValidator(
  "json",
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    available: z.any().optional(),
    services: z.string().optional(),
    address: z.string().optional(),
  })
);

export const uploadAvatarValidator = zValidator(
  "form",
  z.object({
    image: z.any(),
  })
);
