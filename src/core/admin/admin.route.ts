import { Router } from "express";
import { adminLoginController } from "./controllers/admin-login.conroller";
import adminProfileController from "./controllers/admin-profile.controller";
import authGuard from "../../middlewares/auth-guard";
import isAdmin from "../../middlewares/is-admin";
import adminGetUsersController from "./controllers/admin-get-users-controller";

const adminRoutes = Router()

adminRoutes.post("/login", adminLoginController)
adminRoutes.get("/users", authGuard, isAdmin, adminGetUsersController)
adminRoutes.get("/", authGuard, isAdmin, adminProfileController)

export default adminRoutes