import express, { Router } from "express";
const app = express();
import cors from "cors";
import morgan from "morgan";
import { defaultMiddleware, errorMiddleware, notFoundMiddleware } from "./core";
import { corsOptions } from "./config/cors";
import { ROUTES } from "./constants/routes";
import authRoute from "./core/auth/auth.route";
import { CWD } from "./constants";
import session from "express-session";
import path from "path";
import "./config/passport";
import { engine } from "express-handlebars";
import { ENV } from "./constants/env";

import passport from "passport";
import usersRoute from "./core/users/users.route";
import authGuard from "./middlewares/auth-guard";
import propertyRoutes from "./core/property/property.routes";

// import { multipleProperty } from "./helpers/random-data";
// multipleProperty()

app.use(cors(corsOptions));

app.use(
  session({
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

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
apiRoutes.use(ROUTES.SUBROUTES.PROFILE, authGuard, usersRoute);
apiRoutes.use(ROUTES.SUBROUTES.PROPERTY, authGuard, propertyRoutes);

// DO NOT TOUCH >>>>>>>>
app.get(ROUTES.BASE, defaultMiddleware);
app.use(ROUTES.BASE, apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
export default app;
