import { Router } from "express";
import { ROUTES } from "../../constants/routes";
import listAllSubscriptionController from "./list-all-subscription.controller";
import currentSubscriptionController from "./current-subscription.controller";
import subscribeController from "./subscribe.controller";

const subscriptionRoutes = Router();

subscriptionRoutes.get(ROUTES.INDEX, listAllSubscriptionController);
subscriptionRoutes.get(ROUTES.CURRENT_SUB, currentSubscriptionController);
subscriptionRoutes.post(ROUTES.SUBSCRIBE, subscribeController);

export default subscriptionRoutes;
