import { Hono } from "hono";
import { Variables } from "../..";
import { paystack } from "../../config/paystack";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { subscription, transaction, users } from "../../db/schema";
import { nanoid } from "nanoid";

const plansRoutes = new Hono<{ Variables: Variables }>();

plansRoutes.get("/", async (c) => {
  try {
    const plans = await paystack.listPlans();

    const filteredPlans = plans.map((plan) => {
      return {
        id: plan.plan_code,
        name: plan.name,
        amount: plan.amount / 100,
        description: plan.description,
      };
    });

    return c.json({ message: "Plans Retrived", data: filteredPlans });
  } catch (error) {
    return c.json({ message: "internal erver Error" }, 500);
  }
});

// PLN_2fbvlm4b9zq20tm for silver

plansRoutes.post("/subscribe", async (c) => {
  try {
    const { subscription: sub, email, id: userId } = c.get("jwtPayload");
    const body = await c.req.json();
    const { planId } = body;

    if (sub && sub.plan_code === planId && sub.active) {
      return c.json({ message: "You already Subscribed to this plan" }, 400);
    }

    if (!planId) {
      return c.json({ message: "Plan ID is required" }, 400);
    }

    // 3. Create or get customer in Paystack
    let customer;
    try {
      customer = await paystack.createCustomer({ email });
    } catch (error) {
      console.error("Failed to create Paystack customer:", error);
      return c.json({ message: "Failed to create payment customer" }, 500);
    }

    // 4. Get plan details from Paystack
    let plan;
    try {
      plan = await paystack.getPlan(planId);

      if (!plan || !plan.amount) {
        return c.json({ message: "Invalid plan selected" }, 400);
      }
    } catch (error) {
      console.error("Failed to retrieve plan details:", error);
      return c.json({ message: "Failed to retrieve plan details" }, 500);
    }

    // 5. Create transaction record
    const transactionId = nanoid();

    await db.insert(transaction).values({
      id: transactionId,
      plan_code: plan.plan_code,
      user_id: userId,
      amount: plan.amount / 100,
    });

    // 6. Create subscription record
    const subscriptionId = nanoid();

    await db.insert(subscription).values({
      id: subscriptionId,
      user_id: userId,
      transaction_id: transactionId,
      plan_code: plan.plan_code,
      plan_name: plan?.name,
      amount: plan.amount / 100,
      active: false,
      expired: false,
      status: "pending",
    });

    await db.update(users).set({
      subscription_id: subscriptionId,
    });
    // 7. Update transaction with subscription ID
    await db
      .update(transaction)
      .set({ subscription_id: subscriptionId })
      .where(eq(transaction.id, transactionId));

    // 8. Initialize payment with Paystack
    const paymentResponse = await paystack.initTransaction({
      amount: plan.amount,
      email: customer.email,
      // callback_url: process.env.EXPO_APP_SCHEME,
      metadata: JSON.stringify({
        transactionId,
        userId,
        planId: plan.plan_code,
      }),
    });

    if (!paymentResponse?.authorization_url) {
      throw new Error("Failed to generate payment URL");
    }

    if (sub?.code && customer) {
      paystack
        .cancelSubscription({
          code: sub.code,
          token: customer.customer_code,
        })
        .catch((err) => console.log("Sub already inactive"));
    }
    // 9. Return payment URL to client
    return c.json({
      message: "Payment initialized successfully",
      url: paymentResponse.authorization_url,
    });
  } catch (error) {
    console.error("Subscription error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

plansRoutes.delete("/cancel", async (c) => {
  try {
    const { email, id: user_id, subscription: sub } = c.get("jwtPayload");

    const { customer_code } = await paystack.createCustomer({
      email,
    });

    if (!sub?.code) {
      return c.json({ message: "No Subscription Found" }, 400);
    }

    const _sub = await paystack.cancelSubscription({
      code: sub.code as string,
      token: customer_code,
    }).catch((err)=> console.log("Sub already inactive"));

    await db
      .update(subscription)
      .set({
        active: false,
        cancelled: true,
      })
      .where(eq(subscription.user_id, user_id));

    return c.json({ message: "Subscription Cancel" }, 200);
    //
  } catch (error) {
    console.log(error)
    return c.json({ message: "internal erver Error" }, 500);
  }
});

export default plansRoutes;
