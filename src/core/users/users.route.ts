import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import myProfileController from "./controllers/my-profile.controller";
import { updateProfileSchema } from "../../schemas/profile.schema";
import bodyValidation from "../../middlewares/body-validation";
import editProfileController from "./controllers/edit-profile.controller";
import userProfileController from "./controllers/user-profile.controller";
import authGuard from "../../middlewares/auth-guard";

const usersRoute = Router();

usersRoute.get(ROUTES.INDEX,authGuard, myProfileController);
usersRoute.get(ROUTES.INDEX_ID, userProfileController);

usersRoute.put(
  ROUTES.INDEX,
  authGuard,
  updateProfileSchema,
  bodyValidation,
  editProfileController
);

export default usersRoute;
