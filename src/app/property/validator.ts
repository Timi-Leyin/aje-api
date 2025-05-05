import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const createPropertyValidator = zValidator(
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

    listingType: z.string(), // for sale, etc
    type: z.string(), // hotel, etc

    bathrooms: z.string(),
    beds: z.string().optional(),
    bedrooms: z.string(),

    images: z.array(z.any()), // idk
    amenities: z.string(), // ["wifi", "AC"]
    schedule: z.array(z.any()).optional(), // [{monday:{from:D,to:D}}]
  })
);
