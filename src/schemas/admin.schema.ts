import { body } from "express-validator";

export const verifyUserSchema = [
  body("userId")
    .trim()
    .isString()
    .withMessage("userId is Required")
    .isLength({ min: 3 })
    .withMessage("Invalid userId"),
];
export const sendEmailSchema = [
  body("message")
    .trim()
    .isString()
    .withMessage("message is Required")
    .isLength({ min: 3 })
    .withMessage("message must be more 3"),

  body("subject")
    .trim()
    .isString()
    .withMessage("subject is Required")
    .isLength({ min: 3 })
    .withMessage("subject must be more 3"),
];

export const createAdSchema = [
  body("title")
    .trim()
    .isString()
    .optional()
    .isLength({ min: 3 })
    .withMessage("title must be more 3"),
    
  body("description")
    .trim()
    .isString()
    .optional()
    .isLength({ min: 3 })
    .withMessage("description must be more 3"),
];
