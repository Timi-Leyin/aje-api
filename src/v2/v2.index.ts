import { Router } from "express";
import { ROUTES } from "../constants/routes";
import allPropertiesController from "./source/property/controllers/all-properties-controller";

const version2Routes = Router();

version2Routes.use(ROUTES.SUBROUTES.PROPERTY, allPropertiesController);

export default version2Routes;

