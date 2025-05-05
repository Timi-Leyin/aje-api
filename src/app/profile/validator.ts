import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const updateProfileValidator = zValidator(
  "json",
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  })
);

export const uploadAvatarValidator = zValidator(
  "form",
  z.object({
    image: z.any(),
  })
);
