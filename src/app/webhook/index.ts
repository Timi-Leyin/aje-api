import { Hono } from "hono";
import { Variables } from "../..";
import { notification, subscription, transaction, users } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { MAX_LIMIT_DATA } from "../../constants";
import * as crypto from "crypto";
import { paystack } from "../../config/paystack";
import { sendNotification } from "../../helpers/notification";

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

      case "subscription.create":
        await handleSubscriptionCreate(eventData);
        break;

      case "subscription.not_renew":
        await handleSubscriptionNotRenewed(eventData);
        break;

      case "subscription.disable":
        await handleSubscriptionDisable(eventData);
        break;

      case "subscription.enable":
        await handleSubscriptionEnable(eventData);
        break;

      case "subscription.expire":
        await handleSubscriptionExpire(eventData);
        break;

      case "subscription.cancel":
        await handleSubscriptionCancel(eventData);
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
  console.log(`[WEBHOOK] Processing charge.success event:`, eventData);
  
  const metadata = eventData.metadata as { transactionId: string };
  

  if (!metadata?.transactionId) {
    console.error("[WEBHOOK] Missing transactionId in metadata");
    return;
  }

  console.log(`[WEBHOOK] Looking for transaction: ${metadata.transactionId}`);

  // Find the transaction
  const trx = await db.query.transaction.findFirst({
    where: eq(transaction.id, metadata.transactionId),
    with: {
      subscription: true,
      user: true,
    },
  });

  if (!trx) {
    console.error(`[WEBHOOK] Transaction not found: ${metadata.transactionId}`);
    return;
  }

  console.log(`[WEBHOOK] Found transaction:`, {
    id: trx.id,
    status: trx.status,
    paidAt: trx.paid_at,
    subscriptionId: trx.subscription_id,
    subscriptionActive: trx.subscription?.active,
    subscriptionStatus: trx.subscription?.status,
  });

  // If transaction was already paid and has a subscription code, just update the transaction
  if (trx.paid_at && trx.subscription?.code) {
    console.log(`[WEBHOOK] Transaction already paid, updating fees only`);
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
      console.error("[WEBHOOK] Missing user email or plan code");
      return;
    }

    console.log(`[WEBHOOK] Creating subscription for plan: ${trx.plan_code}`);

    const { plan_code } = await paystack.getPlan(trx.plan_code);
    
    // Create subscription with Paystack
    const subscribeResult = await paystack.createSubscription({
      customer: trx.user.email,
      plan: plan_code,
    });

    console.log(`[WEBHOOK] Paystack subscription created:`, subscribeResult);

    // Update transaction status
    await db
      .update(transaction)
      .set({
        paid_at: new Date(),
        fee: Number(eventData.fees),
        status: "success",
      })
      .where(eq(transaction.id, trx.id));

    console.log(`[WEBHOOK] Transaction updated to success`);

    // Update subscription details
    if (trx.subscription_id) {
      console.log(`[WEBHOOK] Updating subscription ${trx.subscription_id} to active`);
      
      await db
        .update(subscription)
        .set({
          paid_at: new Date(),
          active: true,
          code: subscribeResult.subscription_code,
          email_token: subscribeResult.email_token,
          status: "success",
          user_id: trx.user_id,
          next_payment_at: new Date(subscribeResult.next_payment_date),
        })
        .where(eq(subscription.id, trx.subscription_id));

      console.log(`[WEBHOOK] Subscription ${trx.subscription_id} activated successfully`);
    }

    // Send success notification
    if (trx.user_id) {
      console.log(`[WEBHOOK] Sending success notification to user ${trx.user_id}`);
      await sendNotification(trx.user_id, {
        title: "Subscription Activated",
        type: "subscription",
        message: "Your subscription has been successfully activated!",
      }).catch((error) => console.log("[WEBHOOK] Failed to send notification:", error));
    }
  } catch (error) {
    console.error("[WEBHOOK] Failed to create subscription:", error);
  }
}

async function handleInvoiceCreate(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      amount: eventData.amount / 100,
      status: "pending",
      next_payment_at: new Date(eventData.subscription.next_payment_date),
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send invoice notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Subscription Renewal",
      type: "subscription",
      message: `Your subscription renewal invoice of ₦${eventData.amount / 100} has been generated.`,
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handlePaymentFailed(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      active: false,
      expired: true,
      status: "failed",
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send payment failed notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Payment Failed",
      type: "subscription",
      message: "Your subscription payment failed. Please update your payment method to continue your subscription.",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handleSubscriptionCreate(eventData: any) {
  const subscriptionCode = eventData.subscription_code;
  if (!subscriptionCode) return;

  console.log("Subscription created:", subscriptionCode);
  
  // Update subscription with Paystack subscription code
  await db
    .update(subscription)
    .set({
      code: subscriptionCode,
      next_payment_at: new Date(eventData.next_payment_date),
    })
    .where(eq(subscription.code, subscriptionCode));
}

async function handleSubscriptionNotRenewed(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      active: false,
      cancelled: true,
      status: "failed",
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send cancellation notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Subscription Cancelled",
      type: "subscription",
      message: "Your subscription has been cancelled. You can reactivate it anytime from your account settings.",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handleSubscriptionDisable(eventData: any) {
  const subscriptionCode = eventData.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      active: false,
      status: "failed",
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send disable notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Subscription Disabled",
      type: "subscription",
      message: "Your subscription has been temporarily disabled. Please contact support for assistance.",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handleSubscriptionEnable(eventData: any) {
  const subscriptionCode = eventData.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      active: true,
      status: "success",
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send enable notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Subscription Reactivated",
      type: "subscription",
      message: "Your subscription has been reactivated successfully!",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handleSubscriptionExpire(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      active: false,
      expired: true,
      status: "failed",
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send expire notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title: "Subscription Expired",
      type: "subscription",
      message: "Your subscription has expired. Please renew your subscription to continue your service.",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

async function handleSubscriptionCancel(eventData: any) {
  const subscriptionCode = eventData.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.code, subscriptionCode),
    with: { user: true },
  });

  if (!sub) {
    console.error(`Subscription not found: ${subscriptionCode}`);
    return;
  }

  await db
    .update(subscription)
    .set({
      cancel_at_period_end: true,
    })
    .where(eq(subscription.code, subscriptionCode));

  // Send cancel notification
  if (sub.user_id) {
    await sendNotification(sub.user_id, {
      title:
        "Subscription will be cancelled at the end of the current billing period",
      type: "subscription",
      message:
        "Your subscription will be cancelled at the end of the current billing period. You can reactivate it anytime from your account settings.",
    }).catch((error) => console.log("Failed to send notification"));
  }
}

// Type definition for Paystack webhook events
interface PaystackWebhookEvent {
  event: string;
  data: any;
}

export default webhooksRoutes;
