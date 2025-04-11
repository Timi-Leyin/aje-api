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
import { ROUTES } from "../../constants/routes";
import adminEditProperty from "./controllers/admin-edit-property";
import adminNewProducts from "./controllers/admin-new-products";
import adminDeleteProduct from "./controllers/admin-delete-product";
import adminEditProduct from "./controllers/admin-edit-product";

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

const multipleUpload = multerUpload.array("images");
adminRoutes.post(
  "/products",
  authGuard,
  isAdmin,
  multipleUpload,
  adminNewProducts
);
adminRoutes.delete("/products/:id", authGuard, isAdmin, adminDeleteProduct);
adminRoutes.put(
  "/products/:id",
  authGuard,
  isAdmin,
  multipleUpload,
  adminEditProduct
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

adminRoutes.put("/property", authGuard, isAdmin, adminEditProperty);

export default adminRoutes;
