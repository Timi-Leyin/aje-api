import { Router } from "express";
import allReviewsController from "./controllers/all-reviews.controller";
import { ROUTES } from "../../constants/routes";
import addRevewController from "./controllers/add-revew.controller";

const reviewsRoutes = Router();

reviewsRoutes.get(ROUTES.PRODUCT_ID, allReviewsController);
reviewsRoutes.post(ROUTES.INDEX, addRevewController);

export default reviewsRoutes;
