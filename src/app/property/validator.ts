import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const createPropertyValidator = zValidator(
  "form",
  z.object({
    json: z.string(),
    images: z.array(z.any())
  })
);

export const editPropertyValidator = zValidator(
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

    listingType: z.string().optional(), // for sale, etc
    type: z.string().optional(), // hotel, etc

    bathrooms: z.string().optional(),
    beds: z.string().optional(),
    bedrooms: z.string().optional(),

    images: z.array(z.any()).optional(), // idk
    imagesChanges: z.any().optional(), // idk
    amenities: z.string().optional(), // ["wifi", "AC"]
    schedule: z.array(z.any()).optional(), // [{monday:{from:D,to:D}}]
  })
);
