import { Router } from "express";
import { ROUTES } from "../../../constants/routes";
import allPropertiesController from "./controllers/all-properties-controller";

const v2PropertyRoutes = Router();

v2PropertyRoutes.get(ROUTES.INDEX, allPropertiesController);

export default v2PropertyRoutes;
