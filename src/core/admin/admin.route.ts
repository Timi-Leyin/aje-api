import { Router } from "express";
import { adminLoginController } from "./controllers/admin-login.conroller";
import adminProfileController from "./controllers/admin-profile.controller";
import authGuard from "../../middlewares/auth-guard";
import isAdmin from "../../middlewares/is-admin";
import adminGetUsersController from "./controllers/admin-get-users-controller";
import adminVerifyUser from "./controllers/adminVerifyUser";
import {
  createAdSchema,
  sendEmailSchema,
  verifyUserSchema,
} from "../../schemas/admin.schema";
import bodyValidation from "../../middlewares/body-validation";
import sendMessages from "./controllers/send-messages";
import { loginSchema } from "../../schemas/auth.schema";
import createAd from "./controllers/create-ad";
import { multerUpload } from "../../config/multer";
import deleteAds from "./controllers/deleteAds";

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

const upload = multerUpload.single("image");

adminRoutes.post(
  "/ad",
  authGuard,
  isAdmin,
  upload,
  createAdSchema,
  bodyValidation,
  createAd
);
adminRoutes.delete("/ad/:id", authGuard, isAdmin, deleteAds);

export default adminRoutes;
