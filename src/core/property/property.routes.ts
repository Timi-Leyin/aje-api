import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import propertiesController from "./controllers/properties.controller";
import { multerUpload } from "../../config/multer";
import newPropertyController from "./controllers/new-property.controller";
import { newPropertySchema } from "../../schemas/properties.schema";
import bodyValidation from "../../middlewares/body-validation";
import propertyContoller from "./controllers/property.contoller";
import checkSuscription from "../../middlewares/check-suscription";

const propertyRoutes = Router();

const upload = multerUpload.fields([{ name: "images", maxCount: 5 }]);

propertyRoutes.get(ROUTES.INDEX, propertiesController);
propertyRoutes.get(ROUTES.INDEX_ID, propertyContoller);
propertyRoutes.post(
  ROUTES.INDEX,
  checkSuscription,
  //   @ts-ignore
  upload,
  newPropertySchema,
  bodyValidation,
  newPropertyController
);

export default propertyRoutes;
