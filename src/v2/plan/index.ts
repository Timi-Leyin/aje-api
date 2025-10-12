import { Hono } from "hono";
import { Variables } from "../..";
import { PlanDetails } from "../../app/plan/types";
import { paystack } from "../../config/paystack";
import { db } from "../../db";
import { subscription, transaction } from "../../../drizzle/schema";
import { nanoid } from "nanoid";
import { and, eq, or } from "drizzle-orm";
import { users } from "../../db/schema";

const v2PlansRoutes = new Hono<{ Variables: Variables }>();

const SUBSCRIPTION_PLANS: Record<string, Record<string, PlanDetails>> = {
  artisan: {
    "illumia starter": {
      name: "Illumia Starter",
      period: "month",
      description:
        "Start Small. Grow Smart. Kick off your journey as a verified artisan on Illumia!",
      features: [
        "Profile activation",
        "8-day FREE trial as Illumia Elite",
        "Limited job access",
        "Basic visibility to customers",
        "12%–15% commission on completed jobs",
      ],
      highlights: [
        "Start your artisan journey",
        "Get verified status",
        "Access to basic job opportunities",
      ],
    },
    "illumia growth": {
      name: "Illumia Growth",
      period: "month",
      description:
        "Get More Jobs. Reach More People. Take your hustle to the next level and attract more clients!",
      features: [
        "Apply to open job requests",
        "Connect faster with customers",
        "Enhanced profile visibility",
        "Appear higher in search",
        "Only 10% commission",
      ],
      highlights: [
        "Unlimited job applications",
        "Priority customer connections",
        "Better search visibility",
      ],
    },
    "illumia pro": {
      name: "Illumia Pro",
      period: "month",
      description:
        "Be Top Rated. Be Everywhere. For serious artisans ready to dominate their space!",
      features: [
        "Featured as a Top Service Provider",
        "Get recommended directly to customers",
        "Premium platform visibility",
        "Bonus visibility days",
        "More job opportunities, same 10% commission",
      ],
      highlights: [
        "Featured placement",
        "Direct customer recommendations",
        "Maximum visibility and opportunities",
      ],
    },
  },
  vendor: {
    "vendor starter": {
      name: "Vendor Starter",
      period: "month",
      description:
        "Perfect for: Small-scale or new vendors just getting started",
      features: [
        "Feature on the Illumia Vendor Directory",
        "Weekly service request notifications",
        "Basic customer support",
        "Up to 5 service listings",
        "Reach up to 2,000 potential customers",
      ],
      highlights: [
        "Directory listing",
        "Weekly notifications",
        "Basic support",
      ],
    },
    "vendor pro": {
      name: "Vendor Pro",
      period: "month",
      description:
        "Ideal for: Expanding vendors or small businesses looking to grow",
      features: [
        "Listing on the Illumia Vendor Directory",
        "Service request updates three times a week",
        "Unlimited customer support",
        "Up to 20 service listings",
        "Access to basic marketing tools",
        "Exposure to up to 15,000 potential customers",
      ],
      highlights: [
        "Enhanced directory presence",
        "Frequent notifications",
        "Marketing tools access",
      ],
    },
    "vendor elite": {
      name: "Vendor Elite",
      period: "month",
      description:
        "Designed for: Large vendors and well-established businesses ready to scale",
      features: [
        "Premium placement on the Illumia Vendor Directory",
        "Daily service request updates",
        "Priority support service",
        "Unlimited service listings",
        "Access to advanced marketing tools",
        "Free in-app and social media advertising",
        "Exclusive access to premium customer leads",
        "Unlimited customer reach",
      ],
      highlights: [
        "Premium directory placement",
        "Daily notifications",
        "Advanced marketing tools",
        "Unlimited reach",
      ],
    },
  },
};

const USER_TYPES = ["buyer", "agent", "vendor", "artisan", "admin"] as const;
type UserType = (typeof USER_TYPES)[number];

function parsePlanName(planName: string): {
  userType: UserType | null;
  planName: string;
  isValid: boolean;
} {
  const parts = planName.split("@");

  if (parts.length !== 2) {
    return { userType: null, planName, isValid: false };
  }

  const [userType, actualPlanName] = parts;

  if (!USER_TYPES.includes(userType as UserType)) {
    return { userType: null, planName, isValid: false };
  }

  return {
    userType: userType as UserType,
    planName: actualPlanName,
    isValid: true,
  };
}

function getPlanDetails(
  userType: UserType,
  planKey: string
): PlanDetails | null {
  const userPlans = SUBSCRIPTION_PLANS[userType];
  if (!userPlans) return null;

  return userPlans[planKey] || null;
}

function isPlanSuitableForUserType(
  planName: string,
  userType: UserType
): boolean {
  const parsed = parsePlanName(planName);
  return parsed.isValid && parsed.userType === userType;
}

v2PlansRoutes.get("/", async (c) => {
  try {
    const { user_type, id } = c.get("jwtPayload");
    const plans = await paystack.listPlans();
    const filteredPlans = plans
      .filter((plan) => {
        // Exclude plans with name 'test'
        if (plan?.name?.toLowerCase().includes("test")) return false;
        return isPlanSuitableForUserType(plan.name, user_type as UserType);
      })
      .map((plan) => {
        const parsed = parsePlanName(plan.name);
        const planDetails = getPlanDetails(parsed.userType!, parsed.planName);

        return {
          id: plan.plan_code,
          name: parsed.planName,
          fullName: plan.name,
          userType: parsed.userType,
          amount: plan.amount / 100,
          description: plan.description,
          planDetails: planDetails
            ? {
                displayName: planDetails.name,
                price: plan.amount / 100,
                period: planDetails.period,
                description: planDetails.description,
                features: planDetails.features,
                // highlights: planDetails.highlights
              }
            : null,
        };
      });
    return c.json({ message: "Plans Retrieved", data: filteredPlans });
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

v2PlansRoutes.get("/current", async (c) => {
  const { id } = c.get("jwtPayload");

  const currentSub = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.userId, id),
      // eq(subscription.active, 1)
      // eq(subscription.transactionStatus, "success")
    ),
  });

  let subscriptionData = currentSub;

  if (!currentSub) {
    // fallback to latest pending subscription
    const pendingSub = await db.query.subscription.findFirst({
      where: and(
        eq(subscription.userId, id),
        eq(subscription.transactionStatus, "pending")
      ),
    });
    subscriptionData = pendingSub;
  }

  if (!subscriptionData) {
    return c.json({ message: "No subscription found", data: null });
  }

  return c.json({
    message: "Current subscription found",
    data: subscriptionData,
  });
});

v2PlansRoutes.post("/subscribe", async (c) => {
  const { user_type, id, email } = c.get("jwtPayload");
  const { plan_id } = await c.req.json();

  if (!plan_id) {
    return c.json({ message: "Plan not found" }, 400);
  }

  const plan = await paystack.getPlan(plan_id);

  console.log(
    "[SUBSCRIBE]",
    plan.name,
    "#",
    Number(plan.amount / 100).toLocaleString()
  );

  if (!plan) {
    return c.json({ message: "Plan not found" }, 404);
  }

  const existingPlan = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.userId, id),
      or(eq(subscription.active, 1), eq(subscription.expired, 0), eq(subscription.cancelled, 0)),
      // eq(subscription.planCode, plan.plan_code)
    ),
  });

  const next = existingPlan?.next_payment_at;
  // const d = new Date();
  // console.log(next, d)
  // const expired = d > next;
  console.log("Expiring @", next?.toLocaleDateString());
  // console.log(existingPlan);
  if (existingPlan && !existingPlan.cancelled) {
    return c.json(
      { message: "User already has an active subscription for this plan" },
      400
    );
  }

  const trxId = nanoid(30);
  const callback_url = `${process.env.BACKEND_URL}/v2/plan/verify/${trxId}`;
  const payLink = await paystack.initTransaction({
    amount: plan.amount,
    email,
    reference: trxId,
    callback_url,
    metadata: {
      userId: id,
      planCode: plan.plan_code,
      planName: plan.name,
      userType: user_type,
    },
  });
  await db.transaction(async (tx) => {
    // const subId = nanoid();
   await db.insert(transaction).values({
      id: trxId,
      subscriptionId: trxId,
      planCode: plan.plan_code,
      amount: plan.amount,
      userId: id,
    });
    const sub = await tx.insert(subscription).values({
      id: trxId,
      transactionId: trxId,
      // userId: id,
      planCode: plan.plan_code,
    });
  });

  return c.json({
    message: "Subscribe to a plan",
    url: payLink.authorization_url,
  });
});

export async function cancelAllPreviousSubscriptions(userId: string, email: string) {
  console.log(
    `[CANCEL SUBSCRIPTIONS] Cancelling all previous subscriptions for user ${userId}`
  );

  // Get all existing subscriptions for the user
  const existingSubscriptions = await db.query.subscription.findMany({
    where: eq(subscription.userId, userId),
  });

  if (existingSubscriptions.length === 0) {
    console.log(
      `[CANCEL SUBSCRIPTIONS] No existing subscriptions found for user ${userId}`
    );
    return { disabledCount: 0, errors: [] };
  }

  console.log(
    `[CANCEL SUBSCRIPTIONS] Found ${existingSubscriptions.length} existing subscriptions for user ${userId}`
  );

  const errors: string[] = [];
  let disabledCount = 0;

  for (const existingSub of existingSubscriptions) {
    console.log(
      `[CANCEL SUBSCRIPTIONS] Processing subscription ${existingSub.id} (code: ${existingSub.code})`
    );

    // Skip if already cancelled
    if (existingSub.cancelled) {
      console.log(
        `[CANCEL SUBSCRIPTIONS] Subscription ${existingSub.id} already cancelled, skipping`
      );
      continue;
    }

    // Cancel with Paystack if we have a code
    if (existingSub.code) {
      try {
        const { customer_code } = await paystack.createCustomer({ email });

        try {
          await paystack.cancelSubscription({
            code: existingSub.code,
            token: existingSub.email_token || customer_code,
          });
          console.log(
            `[CANCEL SUBSCRIPTIONS] Successfully cancelled subscription ${existingSub.code} with Paystack`
          );
        } catch (err: any) {
          console.log(
            `[CANCEL SUBSCRIPTIONS] Error cancelling subscription ${existingSub.code}:`,
            err?.response?.data || err
          );

          // Check if the error is because subscription is already inactive
          if (
            err?.response?.data?.code === "not_found" ||
            err?.response?.data?.message?.includes("already inactive")
          ) {
            console.log(
              `[CANCEL SUBSCRIPTIONS] Subscription ${existingSub.code} already inactive on Paystack`
            );
          } else {
            errors.push(
              `Failed to cancel Paystack subscription ${existingSub.code}: ${
                err?.response?.data?.message || err.message
              }`
            );
          }
        }
      } catch (error) {
        console.log(
          `[CANCEL SUBSCRIPTIONS] Error in cancellation process for subscription ${existingSub.code}:`,
          error
        );
        errors.push(
          `Error creating customer for subscription ${existingSub.code}: ${error}`
        );
      }
    }

    // Mark subscription as cancelled locally
    try {
      await db
        .update(subscription)
        .set({
          // active: 1,
          cancelled: 1,
          transactionStatus: "failed",
        })
        .where(eq(subscription.id, existingSub.id));

      console.log(
        `[CANCEL SUBSCRIPTIONS] Marked subscription ${existingSub.id} as cancelled locally`
      );
      disabledCount++;
    } catch (error) {
      console.log(
        `[CANCEL SUBSCRIPTIONS] Error updating local subscription ${existingSub.id}:`,
        error
      );
      errors.push(
        `Error updating local subscription ${existingSub.id}: ${error}`
      );
    }
  }

  // We don't clear the user's subscription reference anymore
  // This ensures we keep a record of which subscription the user had
  console.log(
    `[CANCEL SUBSCRIPTIONS] Keeping subscription reference for user ${userId}`
  );

  console.log(
    `[CANCEL SUBSCRIPTIONS] Completed marking subscriptions as cancelled for user ${userId}. Cancelled: ${disabledCount}, Errors: ${errors.length}`
  );

  return { disabledCount, errors };
}

v2PlansRoutes.delete("/cancel", async (c) => {
  const { id, email } = c.get("jwtPayload");

  await cancelAllPreviousSubscriptions(id, email);

  return c.json({ message: "Plan Cancelled" });
});

export default v2PlansRoutes;
