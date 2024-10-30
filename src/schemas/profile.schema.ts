import { body } from "express-validator";

export const updateProfileSchema = [
  body("firstName")
    .isString()
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("First Name must be at least 3 characters"),
  body("lastName")
    .trim()
    .isString()
    .optional()
    .isLength({ min: 3 })
    .withMessage("Last Name must be at least 3 characters"),
  body("bio")
    .trim()
    .isString()
    .optional()
    .isLength({ min: 3 })
    .withMessage("Bio must be at least 3 characters"),
  body("phone")
    .trim()
    .isString()
    .optional()
    .isLength({ min: 3 })
    .withMessage("Phone must be at least 3 characters"),
];
