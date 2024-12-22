import { Router } from "express";
import getAllAds from "./controllers/getAllAds";

const adsRouter = Router();

adsRouter.get("/", getAllAds);

export default adsRouter;
