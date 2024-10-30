import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import myProfileController from "./controllers/my-profile.controller";

const usersRoute = Router();

usersRoute.get(ROUTES.INDEX, myProfileController);

export default usersRoute;
