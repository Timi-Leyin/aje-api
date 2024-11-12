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
    logger("[METHOD]", req.method);
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
        logger(event.data);
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
          fee: Number(event.data.fees),
          sub: {
            update: {
              where: {
                uuid: transaction.subscriptionId,
              },
              data: {
                active: true,
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
    } else if (event.event === "invoice.create") {
      await db.subscription.updateMany({
        where: {
          ref: event.data.subscription.subscription_code,
        },
        data: {
          price: event.data.amount / 100,
          nextPaymentAt:
            event.data.transaction.status == "success"
              ? event.data.subscription.next_payment_date
              : undefined,
          createdAt:
            event.data.transaction.status == "success"
              ? new Date().toISOString()
              : undefined,
        },
      });
    } else if (event.event === "invoice.payment_failed") {
      await db.subscription.updateMany({
        where: {
          ref: event.data.subscription.subscription_code,
        },
        data: {
          active: false,
          expired: true,
        },
      });
    } else if (event.event === "subscription.not_renewed") {
      await db.subscription.updateMany({
        where: {
          ref: event.data.subscription.subscription_code,
        },
        data: {
          active: false,
        },
      });
    }
    // else{
    //     logger(event.event)
    // }

    // logger(event);
    res.sendStatus(200);
  } catch (error) {
    return errorHandler(res, error);
  }
};
