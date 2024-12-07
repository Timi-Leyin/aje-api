import { Router } from "express";
import authGuard from "../../middlewares/auth-guard";
import checkMarketplaceUpload from "../../middlewares/check-marketplace-upload";
import createMarketplaceController from "./controllers/create-marketplace.controller";
import { multerUpload } from "../../config/multer";
import { newMarketplaceSchema } from "../../schemas/marketplace.schema";
import bodyValidation from "../../middlewares/body-validation";

const marketplaceRoute = Router();
const upload = multerUpload.fields([{ name: "images", maxCount: 5 }]);

marketplaceRoute.post(
  "/",
  authGuard,
  upload,
  checkMarketplaceUpload,
  newMarketplaceSchema,
  bodyValidation,
  createMarketplaceController
);

export default marketplaceRoute;
