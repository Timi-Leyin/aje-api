import { Router } from "express";
import { adminLoginController } from "./controllers/admin-login.conroller";
import adminProfileController from "./controllers/admin-profile.controller";
import authGuard from "../../middlewares/auth-guard";
import isAdmin from "../../middlewares/is-admin";
import adminGetUsersController from "./controllers/admin-get-users-controller";
import adminVerifyUser from "./controllers/adminVerifyUser";
import { verifyUserSchema } from "../../schemas/admin.schema";
import bodyValidation from "../../middlewares/body-validation";

const adminRoutes = Router();

adminRoutes.post("/login", adminLoginController);
adminRoutes.get("/users", authGuard, isAdmin, adminGetUsersController);
adminRoutes.get("/", authGuard, isAdmin, adminProfileController);
adminRoutes.get("/verification", authGuard, isAdmin,verifyUserSchema, bodyValidation, adminVerifyUser);

export default adminRoutes;
