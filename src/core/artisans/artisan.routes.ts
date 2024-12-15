import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import artisansController from "./controllers/artisans.controller";
import uploadGalleryController from "./controllers/upload-gallery.controller";
import { multerUpload } from "../../config/multer";
import authGuard from "../../middlewares/auth-guard";

const artisanRoutes = Router();

artisanRoutes.get(ROUTES.INDEX, artisansController);
artisanRoutes.post(
  ROUTES.UPLOAD_GALLERY,
  authGuard,
  multerUpload.array("gallery"),
  uploadGalleryController
);

export default artisanRoutes;
