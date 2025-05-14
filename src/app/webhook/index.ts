import { Hono } from "hono";
import { Variables } from "../..";
import { notification, subscription, transaction } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { MAX_LIMIT_DATA } from "../../constants";
import * as crypto from "crypto";
import { paystack } from "../../config/paystack";

const webhooksRoutes = new Hono<{ Variables: Variables }>();

webhooksRoutes.use("/webhook", async (c) => {
  try {
    const body = await c.req.json();
    const signature = c.req.header("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY as string;
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (hash !== signature) {
      return c.json({ message: "Unuathorized" }, 401);
    }

    const event = body as any;

    if (event.event === "charge.success") {
      const metadata = event.data.metadata as any;

      const getTrx = await db.query.transaction.findFirst({
        where: eq(transaction.id, metadata.transactionId),
        with: {
          subscription: true,
          user: true,
        },
      });

      if (!getTrx) {
        return c.json({ message: "Transaction not found" }, 404);
      }

      if (getTrx?.paid_at && getTrx?.subscription?.code) {
        await db
          .update(transaction)
          .set({
            paid_at: new Date(),
            fee: event?.data?.fees ? Number(event.data.fees) : undefined,
          })
          .where(eq(transaction.id, getTrx.id));
      }
      //   create sub
      const subscribe = await paystack.createSubscription({
        customer: getTrx.user?.email!,
        plan: getTrx.plan_code || "",
      });

      await db
        .update(transaction)
        .set({
          paid_at: new Date(),
          fee: Number(event.data.fees),
          status: "success",
        })
        .where(eq(transaction.id, getTrx.id));
      await db
        .update(subscription)
        .set({
          paid_at: new Date(),
          active: true,
          code: subscribe.subscription_code,
          status: "success",
          user_id: getTrx.user_id,
          next_payment_at: new Date(subscribe.next_payment_date),
        })
        .where(eq(transaction.subscription_id, getTrx.subscription_id!));
    } else if (event.event === "invoice.create") {
      await db
        .update(subscription)
        .set({
          amount: event.data.amount / 100,
          status: "success",
          next_payment_at: new Date(event.data.subscription.next_payment_date),
        })
        .where(
          eq(subscription.code, event.data.subscription.subscription_code)
        );
    } else if (event.event === "invoice.payment_failed") {
      await db
        .update(subscription)
        .set({
          active: false,
          expired: false,
        })
        .where(
          eq(subscription.code, event.data.subscription.subscription_code)
        );
    } else if (event.event === "subscription.not_renewed") {
      await db
        .update(subscription)
        .set({
          active: false,
        })
        .where(
          eq(subscription.code, event.data.subscription.subscription_code)
        );
    }

    return c.json({});
    // else{
    //     logger(event.event)
    // }
  } catch (error) {
    console.log(error)
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default webhooksRoutes;
