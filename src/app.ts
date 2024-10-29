import express, { Router } from "express";
const app = express();
import cors from "cors";
import morgan from "morgan";
import { defaultMiddleware, notFoundMiddleware } from "./core";
import { corsOptions } from "./config/cors";
import { ROUTES } from "./constants/routes";
import authRoute from "./core/auth/auth.route";
import { CWD } from "./constants";
import path from "path";
import { engine } from "express-handlebars";
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(CWD, "public")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(CWD, "templates", "pages"));

// ATTACH OTHER ROUTES TO APIROUTES
const apiRoutes = Router();

apiRoutes.use(ROUTES.SUBROUTES.AUTH, authRoute);

// DO NOT TOUCH >>>>>>>>
app.get(ROUTES.BASE, defaultMiddleware);
app.use(ROUTES.BASE, apiRoutes);
app.use(notFoundMiddleware);
export default app;
