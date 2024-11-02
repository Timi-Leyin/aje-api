import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import propertiesController from "./controllers/properties.controller";
import { multerUpload } from "../../config/multer";
import newPropertyController from "./controllers/new-property.controller";
import { newPropertySchema } from "../../schemas/properties.schema";
import bodyValidation from "../../middlewares/body-validation";

const propertyRoutes = Router();

const upload = multerUpload.fields([{ name: "images", maxCount: 5 }]);

propertyRoutes.get(ROUTES.INDEX, propertiesController);
propertyRoutes.post(
  ROUTES.INDEX,
  //   @ts-ignore
  upload,
  newPropertySchema,
  bodyValidation,
  newPropertyController
);

export default propertyRoutes;
