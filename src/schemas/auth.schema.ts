import { body } from "express-validator";

export const registerSchema = [
  body("email")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Invalid Email Address"),
  body("firstName")
    .isString()
    .trim()
    .withMessage("First Name is Required")
    .isLength({ min: 3 })
    .withMessage("First Name must be at least 3 characters"),
  body("lastName")
    .trim()
    .isString()
    .withMessage("First Name is Required")
    .isLength({ min: 3 })
    .withMessage("Last Name must be at least 3 characters"),
  body("userType")
    .trim()
    .isString()
    .withMessage("User type is Required")
    .isLength({ min: 4 })
    .withMessage("Invalid user type"),
  body("password")
    .trim()
    .isLength({
      min: 6,
    })
    // .isStrongPassword()
    .withMessage(
      // "Passwords must be a minimum of 8 characters. Include one letter (Uppercase and Lowercase), and one number or symbol."
      "Passwords must be a minimum of 6 characters."
    ),
];

export const loginSchema = [
  body("email").isString().trim().isEmail(),
  body("password").isString().trim().isLength({
    min: 1,
  }),
];
export const forgottenPasswordSchema = [
  body("email").isString().trim().isEmail(),
];

export const verifyOtpSchema = [
  body("email").isString().trim().isEmail(),
  body("newPassword")
    .trim()
    .isStrongPassword()
    .withMessage(
      "Passwords must be a minimum of 8 characters. Include one letter (Uppercase and Lowercase), and one number or symbol."
    ),
  body("otp").isString().trim().isLength({ min: 6 }),
];
