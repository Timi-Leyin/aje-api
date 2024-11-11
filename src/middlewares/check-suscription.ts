import { NextFunction, Request, Response } from "express";
import errorHandler from "../helpers/error-handler";
import responseObject from "../helpers/response-object";
import { db } from "../config/database";

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore
    const { user } = req;
    // @ts-ignore
    const userId = user.uuid;
    // @ts-ignore
    const subId = user.subscriptionId;

    // @ts-ignore
    if (!user.verified) {
      return res.status(401).json(
        responseObject({
          message:
            "Verification is still in progress, You Cannot upload properties untill verification is successsfull",
        })
      );
    }

    if (!subId) {
      return NoSubscriptionResponse(res);
    }

    const subscription = await db.subscription.findUnique({
      where: {
        uuid: subId,
      },
    });

    const countProperty = await db.property.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      },
    });
    if (!subscription) {
      return NoSubscriptionResponse(res);
    }

    if (subscription?.type == "FREE" && countProperty >= 3) {
      return res.status(400).json(
        responseObject({
          message:
            "subscription Limit Exceeded for this month, please upgrade for more",
        })
      );
    }

    return next();
  } catch (error) {
    return errorHandler(res, error);
  }
};

export const NoSubscriptionResponse = (res: Response) => {
  return res.status(400).json(
    responseObject({
      message:
        "No valid subscription, Please subscribe to create more properties",
    })
  );
};
