import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import listAllSubscriptionController from "./controllers/list-all-subscription.controller";
import currentSubscriptionController from "./controllers/current-subscription.controller";
import subscribeController from "./controllers/subscribe.controller";
import cancelSubscriptionConroller from "./controllers/cancel-subscription.conroller";

const subscriptionRoutes = Router();

subscriptionRoutes.get(ROUTES.INDEX, listAllSubscriptionController);
subscriptionRoutes.get(ROUTES.CURRENT_SUB, currentSubscriptionController);
subscriptionRoutes.delete(ROUTES.CANCEL, cancelSubscriptionConroller);
subscriptionRoutes.post(ROUTES.SUBSCRIBE, subscribeController);

export default subscriptionRoutes;
