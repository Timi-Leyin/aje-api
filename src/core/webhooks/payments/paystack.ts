import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { ENV } from "../../../constants/env";
import * as crypto from "crypto";
import logger from "../../../helpers/logger";
import { db } from "../../../config/database";
import { paystack } from "../../../config/paystack";

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const secret = ENV.PAYSTACK_SECRET_KEY as string;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Unauthorized");
    }

    // @ts-ignore
    const event = req.body as PaystackEvent;
    logger(event.event);

    if (event.event === "charge.success") {
      const metadata = event.data.metadata as any;
      const transaction = await db.transaction.findFirst({
        where: {
          uuid: metadata.transactionId,
        },
        include: {
          sub: true,
        },
      });

      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }

      if (transaction.paidAt && transaction.sub && transaction.sub.ref) {
        logger(event.data)
        logger("Already Paid");
        return res.status(200);
      }
      //   create sub
      const subscribe = await paystack.createSubscription({
        customer: transaction.userEmail,
        plan: transaction.planCode || "",
      });

      await db.transaction.update({
        where: {
          uuid: transaction?.uuid,
        },
        data: {
          status: "SUCCESS",
          idAddress: event.data.ip_address,
          paidAt: new Date(event.data.paid_at || new Date()).toISOString(),
          fee: event.data.fees,
          sub: {
            update: {
              where: {
                uuid: transaction.subscriptionId,
              },
              data: {
                ref: String(subscribe.subscription_code),
                nextPaymentAt: subscribe.next_payment_date,
                users: {
                  connect: {
                    email: event.data.customer.email,
                  },
                },
              },
            },
          },
        },
      });
    } else if (event.event === "invoice.payment_failed") {
      console.log("Payment failed:", event);
    } else if (event.event === "subscription.not_renewed") {
      console.log("Subscription expired:", event);
    }
    // else{
    //     logger(event.event)
    // }

    res.sendStatus(200);
  } catch (error) {
    return errorHandler(res, error);
  }
};
