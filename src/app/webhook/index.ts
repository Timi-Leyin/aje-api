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
    // 1. Verify webhook signature
    const body = await c.req.json();
    const signature = c.req.header("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      console.error("Missing Paystack secret key");
      return c.json({ message: "Configuration error" }, 500);
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (hash !== signature) {
      console.warn("Invalid Paystack signature");
      return c.json({ message: "Unauthorized" }, 401);
    }

    // 2. Process the webhook event
    const event = body as PaystackWebhookEvent;
    const eventType = event.event;
    const eventData = event.data;

    console.log(`Processing Paystack webhook: ${eventType}`);

    // 3. Handle different event types
    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(eventData);
        break;

      case "invoice.create":
        await handleInvoiceCreate(eventData);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(eventData);
        break;

      // case "subscription.create":
      //   console.log(eventData);
      //   break;

      case "subscription.not_renew":
        await handleSubscriptionNotRenewed(eventData);
        break;

      default:
        console.log(`Unhandled Paystack event: ${eventType}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Helper functions to handle different webhook events
async function handleChargeSuccess(eventData: any) {
  const metadata = eventData.metadata as { transactionId: string };
  if (!metadata?.transactionId) {
    console.error("Missing transactionId in metadata");
    return;
  }

  // Find the transaction
  const trx = await db.query.transaction.findFirst({
    where: eq(transaction.id, metadata.transactionId),
    with: {
      subscription: true,
      user: true,
    },
  });

  if (!trx) {
    console.error(`Transaction not found: ${metadata.transactionId}`);
    return;
  }

  // If transaction was already paid and has a subscription code, just update the transaction
  if (trx.paid_at && trx.subscription?.code) {
    await db
      .update(transaction)
      .set({
        paid_at: new Date(),
        fee: eventData.fees ? Number(eventData.fees) : undefined,
      })
      .where(eq(transaction.id, trx.id));
    return;
  }

  // Create subscription with Paystack
  try {
    if (!trx.user?.email || !trx.plan_code) {
      console.error("Missing user email or plan code");
      return;
    }

    console.log("> Plan Code", trx.plan_code);

    const { plan_code } = await paystack.getPlan(trx.plan_code);
    // Create subscription with Paystack
    const subscribeResult = await paystack.createSubscription({
      customer: trx.user.email,
      plan: plan_code,
    });

    // Update transaction status
    await db
      .update(transaction)
      .set({
        paid_at: new Date(),
        fee: Number(eventData.fees),
        status: "success",
      })
      .where(eq(transaction.id, trx.id));

    // Update subscription details
    if (trx.subscription_id) {
      await db
        .update(subscription)
        .set({
          paid_at: new Date(),
          active: true,
          code: subscribeResult.subscription_code,
          status: "success",
          user_id: trx.user_id,
          next_payment_at: new Date(subscribeResult.next_payment_date),
        })
        .where(eq(subscription.id, trx.subscription_id));
    }
  } catch (error) {
    console.error("Failed to create subscription:", error);
  }
}

async function handleInvoiceCreate(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  await db
    .update(subscription)
    .set({
      amount: eventData.amount / 100,
      status: "success",
      next_payment_at: new Date(eventData.subscription.next_payment_date),
    })
    .where(eq(subscription.code, subscriptionCode));
}

async function handlePaymentFailed(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  await db
    .update(subscription)
    .set({
      active: false,
      expired: false,
    })
    .where(eq(subscription.code, subscriptionCode));
}

async function handleSubscriptionNotRenewed(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  await db
    .update(subscription)
    .set({
      active: false,
      cancelled:true,
    })
    .where(eq(subscription.code, subscriptionCode));
}

// Type definition for Paystack webhook events
interface PaystackWebhookEvent {
  event: string;
  data: any;
}

export default webhooksRoutes;
