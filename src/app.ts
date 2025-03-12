import express, { Router } from "express";
const app = express();
import "./config/passport";
import cors from "cors";
import morgan from "morgan";
import { defaultMiddleware, errorMiddleware, notFoundMiddleware } from "./core";
import { corsOptions } from "./config/cors";
import { ROUTES } from "./constants/routes";
import authRoute from "./core/auth/auth.route";
import { CWD } from "./constants";
import session from "express-session";
import path from "path";
import { engine } from "express-handlebars";
import { ENV } from "./constants/env";

import passport from "passport";
import usersRoute from "./core/users/users.route";
import authGuard from "./middlewares/auth-guard";
import propertyRoutes from "./core/property/property.routes";
import testsRoute from "./core/testing-api/testing-api.routes";
import subscriptionRoutes from "./core/subscription/subscription.routes";
import { paystackWebhook } from "./core/webhooks/payments/paystack";
import reviewsRoutes from "./core/reviews/reviews.route";
import artisanRoutes from "./core/artisans/artisan.routes";
import marketplaceRoute from "./core/marketplace/marketplace.roues";
import adminRoutes from "./core/admin/admin.route";
import adsRouter from "./core/ad/ad.route";

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
app.use(express.static(path.join(CWD, "temp")));
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(CWD, "templates", "pages"));

// ATTACH OTHER ROUTES TO APIROUTES
const apiRoutes = Router();

apiRoutes.use(ROUTES.SUBROUTES.AUTH, authRoute);
apiRoutes.use(ROUTES.SUBROUTES.PROFILE, usersRoute);
apiRoutes.use(ROUTES.SUBROUTES.PROPERTY, propertyRoutes);
apiRoutes.use(ROUTES.SUBROUTES.ARTISAN, artisanRoutes);
apiRoutes.use(ROUTES.SUBROUTES.REVIEWS, authGuard, reviewsRoutes);
apiRoutes.use(ROUTES.SUBROUTES.SUBSCRIPTION, authGuard, subscriptionRoutes);
apiRoutes.use(ROUTES.SUBROUTES.PAYSTACK_WEBHOOK, paystackWebhook);
apiRoutes.use(ROUTES.SUBROUTES.MARKETPLACE, marketplaceRoute);
apiRoutes.use(ROUTES.SUBROUTES.ADMIN, adminRoutes);
apiRoutes.use(ROUTES.SUBROUTES.AD, adsRouter);
apiRoutes.use("/test", testsRoute);
// DO NOT TOUCH >>>>>>>>
app.get(ROUTES.BASE, defaultMiddleware);
app.use(ROUTES.BASE, apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
export default app;
