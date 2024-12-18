import { body } from "express-validator";

export const verifyUserSchema= [
      body("userId")
        .trim()
        .isString()
        .withMessage("userId is Required")
        .isLength({ min: 3 })
        .withMessage("Invalid userId"),
]
