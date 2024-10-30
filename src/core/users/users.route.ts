import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import myProfileController from "./controllers/my-profile.controller";
import { updateProfileSchema } from "../../schemas/profile.schema";
import bodyValidation from "../../middlewares/body-validation";
import editProfileController from "./controllers/edit-profile.controller";

const usersRoute = Router();

usersRoute.get(ROUTES.INDEX, myProfileController);

usersRoute.put(
  ROUTES.INDEX,
  updateProfileSchema,
  bodyValidation,
  editProfileController
);

export default usersRoute;
