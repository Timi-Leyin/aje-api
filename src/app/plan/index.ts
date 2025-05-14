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
    const { planId } = await c.req.json();
    const { email, id: user_id } = c.get("jwtPayload");

    const customer = await paystack.createCustomer({
      email,
    });

    const { amount, name } = await paystack.getPlan(planId);

    // if(!name || !amount ) return

    const transactionId = nanoid();

    await db.insert(transaction).values({
      id: transactionId,
      plan_code: planId,
      user_id,
      amount: amount / 100,
    });

    const trx = await paystack.initTransaction({
      amount,
      email: customer.email,
      metadata: JSON.stringify({
        transactionId,
      }),
    });

    return c.json({
      message: "Url initiated",
      url: trx.authorization_url,
    });
  } catch (error) {
    console.log(error);
    return c.json({ message: "internal erver Error" }, 500);
  }
});

plansRoutes.delete("/cancel", async (c) => {
  try {
    const { email, id: user_id } = c.get("jwtPayload");

    const { customer_code } = await paystack.createCustomer({
      email,
    });

    const sub = await db.query.subscription.findFirst({
      where: eq(users.id, user_id),
    });

    if (!sub || !customer_code) {
      return c.json({ message: "No Subscription Found" }, 400);
    }

    const _sub = await paystack.cancelSubscription({
      code: sub.code as string,
      token: customer_code,
    });

    await db
      .update(subscription)
      .set({
        active: false,
      })
      .where(eq(users.id, user_id));

    return c.json({ message: "Subscription Cancel" }, 200);
    //
  } catch (error) {
    return c.json({ message: "internal erver Error" }, 500);
  }
});
export default plansRoutes;
