import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { paystack } from "../../../config/paystack";
import responseObject from "../../../helpers/response-object";
import { db } from "../../../config/database";

const handleCancel = async (req: Request) => {
  try {
    const { customer_code } = await paystack.createCustomer({
      // @ts-ignore
      email: req.user.email,
    });

    const subCode = await db.subscription.findUnique({
      where: {
        // @ts-ignore
        uuid: req.user.subscriptionId,
      },
    });

    if (!subCode || !customer_code) {
      return false;
    }

    const sub = await paystack.cancelSubscription({
      code: subCode?.ref as string,
      token: customer_code,
    });

    return true;
  } catch (error) {
    return false;
  } finally {
    await db.subscription.update({
      where: {
        // @ts-ignore
        uuid: req.user.subscriptionId,
      },
      data: {
        active: false,
      },
    });
  }
};

export default async (req: Request, res: Response) => {
  try {
    await handleCancel(req);
    res.status(200).json(
      responseObject({
        message: "Subscription Cancelled",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
