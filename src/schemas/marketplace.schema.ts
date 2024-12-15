import { body } from "express-validator";

export const newMarketplaceSchema = [
  body("name").isString().trim().isLength({
    min: 2,
  }),

  body("description").isString().trim().isLength({
    min: 3,
  }),

  body("address").isString().trim().isLength({
    min: 3,
  }),
  body("phoneNumber").isString().trim().isLength({
    min: 3,
  }),

  body("price").isString().trim().isLength({
    min: 1,
  }),
];
