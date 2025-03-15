import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import registerController from "./controllers/register.controller";
import {
  forgottenPasswordSchema,
  loginSchema,
  registerSchema,
  verifyEmailOtpSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from "../../schemas/auth.schema";
import bodyValidation from "../../middlewares/body-validation";
import loginController from "./controllers/login.controller";
import forgottenPasswordController from "./controllers/forgotten-password.controller";
import verifyOtpController from "./controllers/verify-otp.controller";
import passport from "passport";
import {
  FRONTEND_FAILURE_REDIRECT,
  FRONTEND_SUCCESS_REDIRECT,
} from "../../constants";
import googleSuccessController from "./controllers/google-success.controller";
import googleFailureController from "./controllers/google-failure.controller";
import { multerUpload } from "../../config/multer";
import { ENV } from "../../constants/env";
import checkEmailController from "./controllers/check-email.controller";
import sendOtpController from "./controllers/send-otp.controller";
import verifyEmailOtpController from "./controllers/verify-email-otp.controller";

const authRoute = Router();

authRoute.post(ROUTES.LOGIN, loginSchema, bodyValidation, loginController);

authRoute.get(
  ROUTES.GOOGLE_AUTH,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRoute.get(
  ROUTES.GOOGLE_AUTH_CALLBACK,
  passport.authenticate("google", {
    successRedirect: `${ENV.BACKEND_URL}${FRONTEND_SUCCESS_REDIRECT}`,
    failureRedirect: `${ENV.BACKEND_URL}${FRONTEND_FAILURE_REDIRECT}`,
  })
);

authRoute.get(ROUTES.GOOGLE_AUTH_CALLBACK_SUCCESS, googleSuccessController);
authRoute.get(ROUTES.GOOGLE_AUTH_CALLBACK_FAILURE, googleFailureController);

const registerationUpload = multerUpload.fields([
  { name: "govtId", maxCount: 1 },
  { name: "cacDoc", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);
// registration
authRoute.get(ROUTES.CHECK_EMAIL, checkEmailController);

authRoute.post(
  ROUTES.REGISTER,
  registerationUpload,
  registerSchema,
  bodyValidation,
  registerController
);

authRoute.post(
  ROUTES.SEND_OTP,
  verifyEmailSchema,
  bodyValidation,
  sendOtpController
);

authRoute.post(
  ROUTES.VERIFY_OTP,
  verifyEmailOtpSchema,
  bodyValidation,
  verifyEmailOtpController
);

authRoute.post(
  ROUTES.FORGOTTEN_PASSWORD,
  forgottenPasswordSchema,
  bodyValidation,
  forgottenPasswordController
);

authRoute.post(
  ROUTES.VERIFY_FORGOTTEN_PASSWORD,
  verifyOtpSchema,
  bodyValidation,
  verifyOtpController
);

export default authRoute;
