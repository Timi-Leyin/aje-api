import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const newReportValidator = zValidator(
  "json",
  z.object({
    category: z.string(),
    details: z.string().optional(),
    property_id: z.string().optional(),
    artisan_id: z.string().optional(),
    product_id: z.any().optional(),
  })
);
