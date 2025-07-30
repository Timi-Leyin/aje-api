import { Hono } from "hono";
import { Variables } from "../..";
import { paystack } from "../../config/paystack";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { subscription, transaction, users } from "../../db/schema";
import { nanoid } from "nanoid";
import {
  checkAndUpdateExpiredSubscriptions,
  getSubscriptionStatusSummary,
} from "../../helpers/subscription";

const plansRoutes = new Hono<{ Variables: Variables }>();

const USER_TYPES = ["buyer", "agent", "vendor", "artisan", "admin"] as const;
type UserType = (typeof USER_TYPES)[number];

// Plan details type definition
type PlanDetails = {
  name: string;
  period: "month" | "quarter" | "year";
  description: string;
  features: string[];
  highlights: string[];
};

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

function formatPlanName(userType: UserType, planName: string): string {
  return `${userType}@${planName}`;
}

function isPlanSuitableForUserType(
  planName: string,
  userType: UserType
): boolean {
  const parsed = parsePlanName(planName);
  return parsed.isValid && parsed.userType === userType;
}

function getPlanDetails(
  userType: UserType,
  planKey: string
): PlanDetails | null {
  const userPlans = SUBSCRIPTION_PLANS[userType];
  if (!userPlans) return null;

  return userPlans[planKey] || null;
}

// Helper function to check if user has any active subscription
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const activeSub = await db.query.subscription.findFirst({
    where: eq(subscription.user_id, userId),
  });

  return activeSub?.active === true;
}

// Helper function to get all user subscriptions
async function getUserSubscriptions(userId: string) {
  return await db.query.subscription.findMany({
    where: eq(subscription.user_id, userId),
    orderBy: (subscription, { desc }) => [desc(subscription.created_at)],
  });
}

// Helper function to disable all previous subscriptions for a user
async function disableAllPreviousSubscriptions(userId: string, email: string) {
  console.log(
    `[DISABLE SUBSCRIPTIONS] Disabling all previous subscriptions for user ${userId}`
  );

  // Get all existing subscriptions for the user
  const existingSubscriptions = await db.query.subscription.findMany({
    where: eq(subscription.user_id, userId),
  });

  if (existingSubscriptions.length === 0) {
    console.log(
      `[DISABLE SUBSCRIPTIONS] No existing subscriptions found for user ${userId}`
    );
    return { disabledCount: 0, errors: [] };
  }

  console.log(
    `[DISABLE SUBSCRIPTIONS] Found ${existingSubscriptions.length} existing subscriptions for user ${userId}`
  );

  const errors: string[] = [];
  let disabledCount = 0;

  for (const existingSub of existingSubscriptions) {
    console.log(
      `[DISABLE SUBSCRIPTIONS] Processing subscription ${existingSub.id} (code: ${existingSub.code})`
    );

    // Skip if already cancelled
    if (existingSub.cancelled) {
      console.log(
        `[DISABLE SUBSCRIPTIONS] Subscription ${existingSub.id} already cancelled, skipping`
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
            `[DISABLE SUBSCRIPTIONS] Successfully cancelled subscription ${existingSub.code} with Paystack`
          );
        } catch (err: any) {
          console.log(
            `[DISABLE SUBSCRIPTIONS] Error cancelling subscription ${existingSub.code}:`,
            err?.response?.data || err
          );

          // Check if the error is because subscription is already inactive
          if (
            err?.response?.data?.code === "not_found" ||
            err?.response?.data?.message?.includes("already inactive")
          ) {
            console.log(
              `[DISABLE SUBSCRIPTIONS] Subscription ${existingSub.code} already inactive on Paystack`
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
          `[DISABLE SUBSCRIPTIONS] Error in cancellation process for subscription ${existingSub.code}:`,
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
          active: false,
          cancelled: true,
          status: "failed",
        })
        .where(eq(subscription.id, existingSub.id));

      console.log(
        `[DISABLE SUBSCRIPTIONS] Marked subscription ${existingSub.id} as cancelled locally`
      );
      disabledCount++;
    } catch (error) {
      console.log(
        `[DISABLE SUBSCRIPTIONS] Error updating local subscription ${existingSub.id}:`,
        error
      );
      errors.push(
        `Error updating local subscription ${existingSub.id}: ${error}`
      );
    }
  }

  // Clear the user's subscription reference
  try {
    await db
      .update(users)
      .set({
        subscription_id: null,
      })
      .where(eq(users.id, userId));

    console.log(
      `[DISABLE SUBSCRIPTIONS] Cleared subscription reference for user ${userId}`
    );
  } catch (error) {
    console.log(
      `[DISABLE SUBSCRIPTIONS] Error clearing user subscription reference:`,
      error
    );
    errors.push(`Error clearing user subscription reference: ${error}`);
  }

  console.log(
    `[DISABLE SUBSCRIPTIONS] Completed disabling subscriptions for user ${userId}. Disabled: ${disabledCount}, Errors: ${errors.length}`
  );

  return { disabledCount, errors };
}

plansRoutes.get("/", async (c) => {
  try {
    const { user_type, id: user_id } = c.get("jwtPayload");
    const plans = await paystack.listPlans();

    // await debugSubscription(user_id);

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
          // Add structured plan details if available
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

// Get all plans (admin endpoint)
plansRoutes.get("/all", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const plans = await paystack.listPlans();

    const allPlans = plans.map((plan) => {
      const parsed = parsePlanName(plan.name);
      const planDetails = parsed.userType
        ? getPlanDetails(parsed.userType, parsed.planName)
        : null;

      return {
        id: plan.plan_code,
        name: parsed.planName,
        fullName: plan.name,
        userType: parsed.userType,
        isValid: parsed.isValid,
        amount: plan.amount / 100,
        description: plan.description,
        planDetails: planDetails
          ? {
              displayName: planDetails.name,
              price: plan.amount / 100,
              period: planDetails.period,
              description: planDetails.description,
              features: planDetails.features,
              highlights: planDetails.highlights,
            }
          : null,
      };
    });

    return c.json({ message: "All Plans Retrieved", data: allPlans });
  } catch (error) {
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

plansRoutes.post("/subscribe", async (c) => {
  try {
    const {
      subscription: sub,
      email,
      id: userId,
      user_type,
    } = c.get("jwtPayload");
    const body = await c.req.json();
    const { planId } = body;

    if (!planId) {
      return c.json({ message: "Plan ID is required" }, 400);
    }

    console.log(
      `[SUBSCRIPTION] User ${userId} (${email}) attempting to subscribe to plan ${planId}`
    );

    // Always cancel all previous subscriptions before creating a new one
    const { disabledCount, errors } = await disableAllPreviousSubscriptions(
      userId,
      email
    );
    if (errors.length > 0) {
      console.log(
        `[SUBSCRIPTION] Warnings during subscription cancellation:`,
        errors
      );
    }
    console.log(
      `[SUBSCRIPTION] Disabled ${disabledCount} previous subscriptions for user ${userId}`
    );

    // Check if user already has an active subscription to the same plan (should not happen, but for safety)
    const activeSub = await db.query.subscription.findFirst({
      where: and(
        eq(subscription.user_id, userId),
        eq(subscription.plan_code, planId),
        eq(subscription.active, true)
      ),
    });

    if (activeSub) {
      return c.json({ message: "You already Subscribed to this plan" }, 400);
    }

    let customer;
    try {
      customer = await paystack.createCustomer({ email });
      console.log(`[SUBSCRIPTION] Created Paystack customer for ${email}`);
    } catch (error) {
      console.error(
        "[SUBSCRIPTION] Failed to create Paystack customer:",
        error
      );
      return c.json({ message: "Failed to create payment customer" }, 500);
    }

    let plan;
    try {
      plan = await paystack.getPlan(planId);
      console.log(`[SUBSCRIPTION] Retrieved plan details for ${planId}:`);

      if (!plan || !plan.amount) {
        console.log(`[SUBSCRIPTION] Invalid plan selected: ${planId}`);
        return c.json({ message: "Invalid plan selected" }, 400);
      }

      if (!isPlanSuitableForUserType(plan.name, user_type as UserType)) {
        console.log(
          `[SUBSCRIPTION] Plan ${plan.name} not suitable for user type ${user_type}`
        );
        return c.json(
          {
            message: `This plan is not suitable for ${user_type} users. Please select a plan for your user type.`,
          },
          400
        );
      }
    } catch (error) {
      console.error("[SUBSCRIPTION] Failed to retrieve plan details:", error);
      return c.json({ message: "Failed to retrieve plan details" }, 500);
    }

    const transactionId = nanoid();
    console.log(
      `[SUBSCRIPTION] Creating transaction ${transactionId} for plan ${plan.plan_code}`
    );

    await db.insert(transaction).values({
      id: transactionId,
      plan_code: plan.plan_code,
      user_id: userId,
      amount: plan.amount / 100,
    });

    const subscriptionId = nanoid();
    const parsedPlanName = parsePlanName(plan.name);

    console.log(
      `[SUBSCRIPTION] Creating subscription ${subscriptionId} with status pending`
    );

    await db.insert(subscription).values({
      id: subscriptionId,
      user_id: userId,
      transaction_id: transactionId,
      plan_code: plan.plan_code,
      plan_name: parsedPlanName.planName,
      amount: plan.amount / 100,
      active: false, // Will be set to true when payment is confirmed via webhook
      expired: false,
      status: "pending",
    });

    await db.update(users).set({
      subscription_id: subscriptionId,
    });

    await db
      .update(transaction)
      .set({ subscription_id: subscriptionId })
      .where(eq(transaction.id, transactionId));

    console.log(
      `[SUBSCRIPTION] Initializing payment for transaction ${transactionId}`
    );

    const paymentResponse = await paystack.initTransaction({
      amount: plan.amount,
      email: customer.email,
      callback_url: `${process.env.FRONTEND_URL}/payment/success.html?ref=subscription&refId=${subscriptionId}`,
      metadata: JSON.stringify({
        transactionId,
        userId,
        planId: plan.plan_code,
      }),
    });

    if (!paymentResponse?.authorization_url) {
      console.error("[SUBSCRIPTION] Failed to generate payment URL");
      throw new Error("Failed to generate payment URL");
    }

    console.log(
      `[SUBSCRIPTION] Payment initialized successfully for user ${userId}. Payment URL generated.`
    );

    return c.json({
      message: "Payment initialized successfully",
      url: paymentResponse.authorization_url,
      data: {
        previousSubscriptionCancelled: true,
        newPlan: {
          name: parsedPlanName.planName,
          amount: plan.amount / 100,
          planCode: plan.plan_code,
        },
        subscriptionId,
        transactionId,
        status: "pending", // Important: subscription is pending until payment is confirmed
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION] Subscription error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

plansRoutes.delete("/cancel", async (c) => {
  try {
    const { email, id: user_id, subscription: sub } = c.get("jwtPayload");

    if (!sub?.code) {
      return c.json({ message: "No Subscription Found" }, 400);
    }

    // Check if subscription is already cancelled
    if (sub.cancelled) {
      return c.json({ message: "Subscription is already cancelled" }, 400);
    }

    const { customer_code, ...customer } = await paystack.createCustomer({
      email,
    });
    // Try to cancel subscription with Paystack
    let paystackCancelled = false;
    try {
      console.log({
        code: sub.code,
        token: sub,
      });
      await paystack.cancelSubscription({
        code: sub.code as string,
        token: sub.email_token!,
      });
      paystackCancelled = true;
      console.log("Successfully cancelled subscription with Paystack");
    } catch (err: any) {
      console.log("Paystack cancellation error:", err?.response?.data || err);

      // Check if the error is because subscription is already inactive
      if (
        err?.response?.data?.code === "not_found" ||
        err?.response?.data?.message?.includes("already inactive")
      ) {
        paystackCancelled = true; // Consider it cancelled since it's already inactive
        console.log("Subscription already inactive on Paystack");
      } else {
        console.log(
          "Failed to cancel subscription with Paystack, but will update local status"
        );
      }
    }

    // Always update local subscription status regardless of Paystack response
    await db
      .update(subscription)
      .set({
        active: false,
        cancelled: true,
        status: "failed",
      })
      .where(eq(subscription.user_id, user_id));

    return c.json(
      {
        message: paystackCancelled
          ? "Subscription cancelled successfully"
          : "Subscription marked as cancelled locally (Paystack cancellation failed)",
        data: {
          paystackCancelled,
          localCancelled: true,
        },
      },
      200
    );
  } catch (error) {
    console.log("Cancel subscription error:", error);
    return c.json({ message: "Internal Server Error" }, 500);
  }
});

// Upgrade subscription to a different plan
plansRoutes.post("/upgrade", async (c) => {
  try {
    const {
      subscription: currentSub,
      email,
      id: userId,
      user_type,
    } = c.get("jwtPayload");
    const body = await c.req.json();
    const { planId } = body;

    if (!currentSub?.code) {
      return c.json({ message: "No active subscription found" }, 400);
    }

    if (!planId) {
      return c.json({ message: "Plan ID is required" }, 400);
    }

    // Get the new plan details
    let newPlan;
    try {
      newPlan = await paystack.getPlan(planId);

      if (!newPlan || !newPlan.amount) {
        return c.json({ message: "Invalid plan selected" }, 400);
      }

      if (!isPlanSuitableForUserType(newPlan.name, user_type as UserType)) {
        return c.json(
          {
            message: `This plan is not suitable for ${user_type} users. Please select a plan for your user type.`,
          },
          400
        );
      }
    } catch (error) {
      console.error("Failed to retrieve plan details:", error);
      return c.json({ message: "Failed to retrieve plan details" }, 500);
    }

    // Disable all previous subscriptions before creating new one
    const { disabledCount, errors } = await disableAllPreviousSubscriptions(
      userId,
      email
    );

    if (errors.length > 0) {
      console.log(
        `[UPGRADE] Warnings during subscription cancellation:`,
        errors
      );
    }

    console.log(
      `[UPGRADE] Disabled ${disabledCount} previous subscriptions for user ${userId}`
    );

    // Create new subscription
    const transactionId = nanoid();
    const subscriptionId = nanoid();
    const parsedPlanName = parsePlanName(newPlan.name);

    // Create new transaction
    await db.insert(transaction).values({
      id: transactionId,
      plan_code: newPlan.plan_code,
      user_id: userId,
      amount: newPlan.amount / 100,
    });

    // Create new subscription record
    await db.insert(subscription).values({
      id: subscriptionId,
      user_id: userId,
      transaction_id: transactionId,
      plan_code: newPlan.plan_code,
      plan_name: parsedPlanName.planName,
      amount: newPlan.amount / 100,
      active: false,
      expired: false,
      status: "pending",
    });

    // Update user's subscription reference
    await db.update(users).set({
      subscription_id: subscriptionId,
    });

    // Update transaction with subscription ID
    await db
      .update(transaction)
      .set({ subscription_id: subscriptionId })
      .where(eq(transaction.id, transactionId));

    // Initialize payment for the new plan
    const paymentResponse = await paystack.initTransaction({
      amount: newPlan.amount,
      email: email,
      callback_url: `${process.env.FRONTEND_URL}/payment/success.html`,
      metadata: JSON.stringify({
        transactionId,
        userId,
        planId: newPlan.plan_code,
        upgrade: true,
      }),
    });

    if (!paymentResponse?.authorization_url) {
      throw new Error("Failed to generate payment URL");
    }

    return c.json({
      message: "Subscription upgrade initiated successfully",
      url: paymentResponse.authorization_url,
    });
  } catch (error) {
    console.error("Subscription upgrade error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Get subscription status and details
plansRoutes.get("/status", async (c) => {
  try {
    const { subscription: sub, user_type } = c.get("jwtPayload");

    if (!sub) {
      return c.json({
        message: "No subscription found",
        data: {
          hasSubscription: false,
          status: "none",
          reason: "No subscription record found for user",
        },
      });
    }

    console.log(`[STATUS] Checking subscription status for user:`, {
      subscriptionId: sub.id,
      status: sub.status,
      active: sub.active,
      cancelled: sub.cancelled,
      expired: sub.expired,
      paidAt: sub.paid_at,
      planCode: sub.plan_code,
    });

    const planDetails = sub.plan_name
      ? getPlanDetails(user_type as UserType, sub.plan_name)
      : null;

    // Determine the reason for inactive status
    let inactiveReason = null;
    if (!sub.active) {
      if (sub.cancelled) {
        inactiveReason = "Subscription was cancelled";
      } else if (sub.expired) {
        inactiveReason = "Subscription has expired";
      } else if (sub.status === "pending") {
        inactiveReason =
          "Payment is pending - waiting for payment confirmation";
      } else if (sub.status === "failed") {
        inactiveReason = "Payment failed or subscription creation failed";
      } else if (!sub.paid_at) {
        inactiveReason = "Payment not yet completed";
      } else {
        inactiveReason = "Subscription is inactive for unknown reason";
      }
    }

    return c.json({
      message: "Subscription status retrieved",
      data: {
        hasSubscription: true,
        status: sub.status,
        active: sub.active,
        cancelled: sub.cancelled,
        expired: sub.expired,
        planName: sub.plan_name,
        planCode: sub.plan_code,
        amount: sub.amount,
        nextPaymentAt: sub.next_payment_at,
        paidAt: sub.paid_at,
        subscriptionId: sub.id,
        paystackCode: sub.code,
        inactiveReason,
        planDetails: planDetails
          ? {
              displayName: planDetails.name,
              period: planDetails.period,
              description: planDetails.description,
              features: planDetails.features,
              highlights: planDetails.highlights,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Get subscription history
plansRoutes.get("/history", async (c) => {
  try {
    const { id: userId, user_type } = c.get("jwtPayload");

    const subscriptions = await getUserSubscriptions(userId);

    const subscriptionHistory = await Promise.all(
      subscriptions.map(async (sub) => {
        const planDetails = sub.plan_name
          ? getPlanDetails(user_type as UserType, sub.plan_name)
          : null;

        return {
          id: sub.id,
          planName: sub.plan_name,
          planCode: sub.plan_code,
          amount: sub.amount,
          status: sub.status,
          active: sub.active,
          cancelled: sub.cancelled,
          expired: sub.expired,
          paidAt: sub.paid_at,
          nextPaymentAt: sub.next_payment_at,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          paystackCode: sub.code,
          planDetails: planDetails
            ? {
                displayName: planDetails.name,
                period: planDetails.period,
                description: planDetails.description,
                features: planDetails.features,
                highlights: planDetails.highlights,
              }
            : null,
        };
      })
    );

    return c.json({
      message: "Subscription history retrieved",
      data: {
        subscriptions: subscriptionHistory,
        total: subscriptionHistory.length,
        activeCount: subscriptionHistory.filter((sub) => sub.active).length,
        cancelledCount: subscriptionHistory.filter((sub) => sub.cancelled)
          .length,
      },
    });
  } catch (error) {
    console.error("Subscription history error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Reactivate cancelled subscription
plansRoutes.post("/reactivate", async (c) => {
  try {
    const { subscription: sub, email, user_type } = c.get("jwtPayload");

    if (!sub?.code) {
      return c.json({ message: "No subscription found to reactivate" }, 400);
    }

    if (!sub.cancelled) {
      return c.json({ message: "Subscription is not cancelled" }, 400);
    }

    // Disable all previous subscriptions before reactivating
    if (!sub.user_id) {
      return c.json({ message: "Invalid subscription: missing user ID" }, 400);
    }

    const { disabledCount, errors } = await disableAllPreviousSubscriptions(
      sub.user_id,
      email
    );

    if (errors.length > 0) {
      console.log(
        `[REACTIVATE] Warnings during subscription cancellation:`,
        errors
      );
    }

    console.log(
      `[REACTIVATE] Disabled ${disabledCount} previous subscriptions for user ${sub.user_id}`
    );

    // Get current plan details
    let plan;
    try {
      plan = await paystack.getPlan(sub.plan_code);
      if (!plan || !plan.amount) {
        return c.json({ message: "Plan not found" }, 400);
      }
    } catch (error) {
      console.error("Failed to retrieve plan details:", error);
      return c.json({ message: "Failed to retrieve plan details" }, 500);
    }

    // Create customer and reactivate subscription
    const { customer_code } = await paystack.createCustomer({ email });

    try {
      const reactivateResult = await paystack.createSubscription({
        customer: email,
        plan: plan.plan_code,
      });

      // Update subscription status
      await db
        .update(subscription)
        .set({
          active: true,
          cancelled: false,
          expired: false,
          status: "success",
          code: reactivateResult.subscription_code,
          email_token: reactivateResult.email_token,
          next_payment_at: new Date(reactivateResult.next_payment_date),
        })
        .where(eq(subscription.code, sub.code));

      return c.json({
        message: "Subscription reactivated successfully",
        data: {
          nextPaymentAt: reactivateResult.next_payment_date,
        },
      });
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      return c.json({ message: "Failed to reactivate subscription" }, 500);
    }
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Debug endpoint to check subscription status with Paystack
plansRoutes.get("/debug/:subscriptionCode", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    // Only admin can access debug endpoints
    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const subscriptionCode = c.req.param("subscriptionCode");

    if (!subscriptionCode) {
      return c.json({ message: "Subscription code is required" }, 400);
    }

    try {
      const paystackSubscription = await paystack.getSubscriptionDetails(
        subscriptionCode
      );

      // Get local subscription
      const localSubscription = await db.query.subscription.findFirst({
        where: eq(subscription.code, subscriptionCode),
        with: { user: true },
      });

      return c.json({
        message: "Subscription debug info",
        data: {
          paystack: {
            status: paystackSubscription.status,
            active: paystackSubscription.status === "active",
            cancelled: paystackSubscription.cancelledAt ? true : false,
            cancelledAt: paystackSubscription.cancelledAt,
            nextPaymentDate: paystackSubscription.next_payment_date,
            createdAt: paystackSubscription.createdAt,
            updatedAt: paystackSubscription.updatedAt,
          },
          local: localSubscription
            ? {
                status: localSubscription.status,
                active: localSubscription.active,
                cancelled: localSubscription.cancelled,
                expired: localSubscription.expired,
                paidAt: localSubscription.paid_at,
                nextPaymentAt: localSubscription.next_payment_at,
                planName: localSubscription.plan_name,
                planCode: localSubscription.plan_code,
                amount: localSubscription.amount,
                userId: localSubscription.user_id,
                email_token: localSubscription.email_token,
                userName:
                  localSubscription.user?.first_name +
                  " " +
                  localSubscription.user?.last_name,
              }
            : null,
          syncStatus: {
            statusMatch: localSubscription
              ? paystackSubscription.status === localSubscription.status
              : false,
            activeMatch: localSubscription
              ? (paystackSubscription.status === "active") ===
                localSubscription.active
              : false,
            cancelledMatch: localSubscription
              ? (paystackSubscription.cancelledAt ? true : false) ===
                localSubscription.cancelled
              : false,
          },
        },
      });
    } catch (error: any) {
      console.error("Error fetching subscription details:", error);

      return c.json(
        {
          message: "Error fetching subscription details",
          error: {
            message: error?.response?.data?.message || error.message,
            code: error?.response?.data?.code || "unknown",
            status: error?.response?.status || "unknown",
          },
        },
        500
      );
    }
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Debug endpoint to check user's subscription state
plansRoutes.get("/debug/user/:userId", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    // Only admin can access debug endpoints
    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const targetUserId = c.req.param("userId");

    if (!targetUserId) {
      return c.json({ message: "User ID is required" }, 400);
    }

    // Get user's subscriptions
    const userSubscriptions = await db.query.subscription.findMany({
      where: eq(subscription.user_id, targetUserId),
      orderBy: (subscription, { desc }) => [desc(subscription.created_at)],
    });

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    // Get user's transactions
    const userTransactions = await db.query.transaction.findMany({
      where: eq(transaction.user_id, targetUserId),
      orderBy: (transaction, { desc }) => [desc(transaction.created_at)],
    });

    return c.json({
      message: "User subscription debug info",
      data: {
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              userType: user.user_type,
              subscriptionId: user.subscription_id,
            }
          : null,
        subscriptions: userSubscriptions.map((sub) => ({
          id: sub.id,
          code: sub.code,
          email_token: sub.email_token,
          planName: sub.plan_name,
          planCode: sub.plan_code,
          amount: sub.amount,
          status: sub.status,
          active: sub.active,
          cancelled: sub.cancelled,
          expired: sub.expired,
          paidAt: sub.paid_at,
          nextPaymentAt: sub.next_payment_at,
          createdAt: sub.created_at,
          updatedAt: sub.updated_at,
          planDetails: sub.plan_name
            ? getPlanDetails(user_type as UserType, sub.plan_name)
            : null,
        })),
        transactions: userTransactions.map((trx) => ({
          id: trx.id,
          planCode: trx.plan_code,
          amount: trx.amount,
          status: trx.status,
          paidAt: trx.paid_at,
          fee: trx.fee,
          subscriptionId: trx.subscription_id,
          createdAt: trx.created_at,
        })),
        summary: {
          total: userSubscriptions.length,
          active: userSubscriptions.filter((sub) => sub.active).length,
          cancelled: userSubscriptions.filter((sub) => sub.cancelled).length,
          pending: userSubscriptions.filter((sub) => sub.status === "pending")
            .length,
          expired: userSubscriptions.filter((sub) => sub.expired).length,
          totalTransactions: userTransactions.length,
          successfulTransactions: userTransactions.filter(
            (trx) => trx.status === "success"
          ).length,
        },
        issues: {
          multipleActive:
            userSubscriptions.filter((sub) => sub.active).length > 1,
          noActiveButHasReference:
            userSubscriptions.filter((sub) => sub.active).length === 0 &&
            user?.subscription_id,
          referenceMismatch:
            user?.subscription_id &&
            !userSubscriptions.find((sub) => sub.id === user.subscription_id),
          pendingSubscriptions:
            userSubscriptions.filter((sub) => sub.status === "pending").length >
            0,
          unpaidTransactions:
            userTransactions.filter((trx) => !trx.paid_at).length > 0,
        },
        recommendations: {
          needsWebhookProcessing:
            userSubscriptions.filter(
              (sub) => sub.status === "pending" && !sub.paid_at
            ).length > 0,
          needsManualActivation:
            userSubscriptions.filter(
              (sub) => sub.status === "success" && !sub.active
            ).length > 0,
          needsCleanup:
            userSubscriptions.filter((sub) => sub.cancelled && sub.active)
              .length > 0,
        },
      },
    });
  } catch (error) {
    console.error("User debug endpoint error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Handle Paystack payment callback/redirect
plansRoutes.get("/callback", async (c) => {
  try {
    const { reference, trxref } = c.req.query();
    const transactionRef = reference || trxref;

    if (!transactionRef) {
      return c.json({ message: "Missing transaction reference" }, 400);
    }

    // Verify the transaction with Paystack
    try {
      const verification = await paystack.verifyTransaction(transactionRef);

      if (verification.status === "success") {
        // Transaction was successful
        const metadata = verification.metadata;

        if (metadata) {
          const parsedMetadata =
            typeof metadata === "string" ? JSON.parse(metadata) : metadata;

          // Find the transaction in our database
          const trx = await db.query.transaction.findFirst({
            where: eq(transaction.id, parsedMetadata.transactionId),
            with: {
              subscription: true,
              user: true,
            },
          });

          if (trx) {
            // Update transaction status if not already updated
            if (!trx.paid_at) {
              await db
                .update(transaction)
                .set({
                  paid_at: new Date(),
                  status: "success",
                })
                .where(eq(transaction.id, trx.id));
            }

            // Update subscription status if not already active
            if (trx.subscription && !trx.subscription.active) {
              await db
                .update(subscription)
                .set({
                  active: true,
                  status: "success",
                  paid_at: new Date(),
                })
                .where(eq(subscription.id, trx.subscription.id));
            }

            return c.json({
              message: "Payment successful",
              data: {
                transactionId: trx.id,
                status: "success",
                amount: trx.amount,
                planCode: trx.plan_code,
              },
            });
          }
        }
      } else {
        // Transaction failed
        return c.json({
          message: "Payment failed",
          data: {
            status: "failed",
            reference: transactionRef,
          },
        });
      }
    } catch (error) {
      console.error("Error verifying transaction:", error);
      return c.json({ message: "Error verifying transaction" }, 500);
    }

    return c.json({ message: "Callback processed" });
  } catch (error) {
    console.error("Callback error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Manual activation endpoint (for debugging/testing)
plansRoutes.post("/activate/:subscriptionId", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    // Only admin can access this endpoint
    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const subscriptionId = c.req.param("subscriptionId");

    if (!subscriptionId) {
      return c.json({ message: "Subscription ID is required" }, 400);
    }

    console.log(
      `[MANUAL ACTIVATION] Attempting to manually activate subscription ${subscriptionId}`
    );

    // Find the subscription
    const sub = await db.query.subscription.findFirst({
      where: eq(subscription.id, subscriptionId),
      with: {
        user: true,
        transaction: true,
      },
    });

    if (!sub) {
      return c.json({ message: "Subscription not found" }, 404);
    }

    console.log(`[MANUAL ACTIVATION] Found subscription:`, {
      id: sub.id,
      status: sub.status,
      active: sub.active,
      cancelled: sub.cancelled,
      userId: sub.user_id,
      planCode: sub.plan_code,
    });

    if (sub.active) {
      return c.json({ message: "Subscription is already active" }, 400);
    }

    if (sub.cancelled) {
      return c.json({ message: "Cannot activate cancelled subscription" }, 400);
    }

    // Disable all previous subscriptions before manual activation
    if (sub.user?.email && sub.user_id) {
      const { disabledCount, errors } = await disableAllPreviousSubscriptions(
        sub.user_id,
        sub.user.email
      );

      if (errors.length > 0) {
        console.log(
          `[MANUAL ACTIVATION] Warnings during subscription cancellation:`,
          errors
        );
      }

      console.log(
        `[MANUAL ACTIVATION] Disabled ${disabledCount} previous subscriptions for user ${sub.user_id}`
      );
    }

    // Try to create subscription with Paystack
    try {
      if (!sub.user?.email || !sub.plan_code) {
        return c.json({ message: "Missing user email or plan code" }, 400);
      }

      console.log(
        `[MANUAL ACTIVATION] Creating Paystack subscription for plan ${sub.plan_code}`
      );

      const { plan_code } = await paystack.getPlan(sub.plan_code);

      const { subscription_code, next_payment_date, email_token } =
        await paystack.createSubscription({
          customer: sub.user.email,
          plan: plan_code,
        });

      console.log(`[MANUAL ACTIVATION] Paystack subscription created:`, {
        subscription_code,
        next_payment_date,
        email_token,
      });

      // Update subscription to active
      await db
        .update(subscription)
        .set({
          active: true,
          status: "success",
          code: subscription_code,
          email_token: email_token,
          paid_at: new Date(),
          next_payment_at: new Date(next_payment_date),
        })
        .where(eq(subscription.id, subscriptionId));

      console.log(
        `[MANUAL ACTIVATION] Subscription ${subscriptionId} manually activated successfully`
      );

      return c.json({
        message: "Subscription manually activated successfully",
        data: {
          subscriptionId: sub.id,
          paystackCode: subscription_code,
          nextPaymentAt: next_payment_date,
        },
      });
    } catch (error: any) {
      console.error(
        "[MANUAL ACTIVATION] Failed to create Paystack subscription:",
        error
      );
      return c.json(
        {
          message: "Failed to create Paystack subscription",
          error: error?.response?.data || error.message,
        },
        500
      );
    }
  } catch (error) {
    console.error("[MANUAL ACTIVATION] Manual activation error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Admin endpoint to check and update expired subscriptions
plansRoutes.post("/admin/check-expired", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    // Only admin can access this endpoint
    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    console.log("[ADMIN] Manual expired subscription check triggered");

    const result = await checkAndUpdateExpiredSubscriptions();
    const summary = await getSubscriptionStatusSummary();

    return c.json({
      message: "Expired subscription check completed",
      data: {
        result,
        summary,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[ADMIN] Error in manual expired subscription check:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

// Admin endpoint to get subscription status summary
plansRoutes.get("/admin/subscription-summary", async (c) => {
  try {
    const { user_type } = c.get("jwtPayload");

    // Only admin can access this endpoint
    if (user_type !== "admin") {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const summary = await getSubscriptionStatusSummary();

    return c.json({
      message: "Subscription summary retrieved",
      data: summary,
    });
  } catch (error) {
    console.error("[ADMIN] Error getting subscription summary:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default plansRoutes;
