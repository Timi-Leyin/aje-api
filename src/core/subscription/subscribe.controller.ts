import { Request, Response } from "express";
import errorHandler from "../../helpers/error-handler";
import { paystack } from "../../config/paystack";
import responseObject from "../../helpers/response-object";
import logger from "../../helpers/logger";
import { db } from "../../config/database";
import { SUBSCRIPTION_MODEL } from "@prisma/client";

// PLN_2fbvlm4b9zq20tm for silver

export default async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    // @ts-ignore
    // const email = "2amm@gaaaaamaqail.coma.ng";
    const { email } = req.user;

    const customer = await paystack.createCustomer({
      email,
    });

    const { amount, name } = await paystack.getPlan(planId);

    const transactionDB = await db.transaction.create({
      data: {
        userEmail: email,
        planCode: planId,
        sub: {
          create: {
            type: name.toUpperCase() as SUBSCRIPTION_MODEL,
            price: amount / 100,
          },
        },
      },
    });

    const transaction = await paystack.initTransaction({
      amount,
      email: customer.email,
      metadata: JSON.stringify({
        transactionId: transactionDB.uuid,
      }),
    });

    await db.transaction.update({
      where: {
        uuid: transactionDB.uuid,
      },
      data: {
        status: "PENDING",
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Subscription url initiated",
        data: {
          url: transaction.authorization_url,
        },
      })
    );
  } catch (error) {
    console.log(error);
    return errorHandler(res, error);
  }
};
