import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { db } from "../../../config/database";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const { user } = req;
    const subscription = await db.subscription.findFirst({
      where: {
        users: {
          some: {
            // @ts-ignore
            uuid: user.uuid,
          },
        },
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Current Subscription Retrieved Successfully",
        data: subscription,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
