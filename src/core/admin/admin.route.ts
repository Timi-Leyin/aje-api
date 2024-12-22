import { Router } from "express";
import { adminLoginController } from "./controllers/admin-login.conroller";
import adminProfileController from "./controllers/admin-profile.controller";
import authGuard from "../../middlewares/auth-guard";
import isAdmin from "../../middlewares/is-admin";
import adminGetUsersController from "./controllers/admin-get-users-controller";
import adminVerifyUser from "./controllers/adminVerifyUser";
import { sendEmailSchema, verifyUserSchema } from "../../schemas/admin.schema";
import bodyValidation from "../../middlewares/body-validation";
import sendMessages from "./controllers/send-messages";
import { loginSchema } from "../../schemas/auth.schema";
import createAd from "./controllers/create-ad";

const adminRoutes = Router();

adminRoutes.post("/login", loginSchema, bodyValidation, adminLoginController);
adminRoutes.get("/users", authGuard, isAdmin, adminGetUsersController);
adminRoutes.get("/", authGuard, isAdmin, adminProfileController);
adminRoutes.post(
  "/verification",
  authGuard,
  isAdmin,
  verifyUserSchema,
  bodyValidation,
  adminVerifyUser
);
adminRoutes.post(
  "/send-message",
  authGuard,
  isAdmin,
  sendEmailSchema,
  bodyValidation,
  sendMessages
);
adminRoutes.post(
  "/ads",
  authGuard,
  isAdmin,
  sendEmailSchema,
  bodyValidation,
  createAd
);

export default adminRoutes;
