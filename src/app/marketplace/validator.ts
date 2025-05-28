import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const createProductValidator = zValidator(
  "form",
  z.object({
    title: z.string(),
    description: z.string(),
    price: z.string(),
    currency: z.enum(["USD", "NGN"]),
    lat: z.string().optional(),
    lon: z.string().optional(),
    city: z.string(),
    address: z.string(),
    type: z.string(),

    images: z.any(),
  })
);

export const editProductValidator = zValidator(
  "form",
  z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    currency: z.enum(["USD", "NGN"]).optional(),
    lat: z.string().optional(),
    lon: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    type: z.string().optional(),
    otherImages: z.string().optional(),

    images: z.any().optional(),
  })
);
