import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import propertiesController from "./controllers/properties.controller";
import { multerUpload } from "../../config/multer";
import newPropertyController from "./controllers/new-property.controller";
import { newPropertySchema } from "../../schemas/properties.schema";
import bodyValidation from "../../middlewares/body-validation";
import propertyContoller from "./controllers/property.contoller";
import checkSuscription from "../../middlewares/check-suscription";
import myPropertiesController from "./controllers/my-properties.controller";
import authGuard from "../../middlewares/auth-guard";
import authGuardOptional from "../../middlewares/auth-guard-optional";
import editPropertyController from "./controllers/edit-property.controller";
import deletePropertyController from "./controllers/delete-property.controller";

const propertyRoutes = Router();

const upload = multerUpload.fields([{ name: "images", maxCount: 5 }]);

propertyRoutes.get(ROUTES.MY_PROPERTY, authGuard, myPropertiesController);
propertyRoutes.get(ROUTES.INDEX, propertiesController);
propertyRoutes.delete(
  ROUTES.INDEX_ID,
  authGuardOptional,
  deletePropertyController
);
propertyRoutes.get(ROUTES.INDEX_ID, authGuardOptional, propertyContoller);
propertyRoutes.post(
  ROUTES.INDEX,
  authGuard,
  checkSuscription,
  //   @ts-ignore
  upload,
  newPropertySchema,
  bodyValidation,
  newPropertyController
);
propertyRoutes.put(ROUTES.INDEX, authGuard, upload, editPropertyController);

export default propertyRoutes;
