import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import propertiesController from "./controllers/properties.controller";

const propertyRoutes = Router();

propertyRoutes.get(ROUTES.INDEX, propertiesController);

export default propertyRoutes;
