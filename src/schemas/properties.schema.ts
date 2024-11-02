import { body } from "express-validator";

export const newPropertySchema = [
  body("title").isString().trim().isLength({
    min: 5,
  }),

  body("description").isString().trim().isLength({
    min: 5,
  }),

  body("tags")
    .isString()
    .trim()
    .isLength({
      min: 1,
    }) // seperated by comma
    .optional(),

  body("price").isString().trim().isLength({
    min:1
  }),

  body("listingType")
    .isString()
    .trim()
    .matches(/rent|sale/)
    .withMessage("Must be Rent or Sale"),
];
