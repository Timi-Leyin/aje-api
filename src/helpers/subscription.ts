import { db } from "../db";
import { subscription } from "../db/schema";
import { eq, lt, and, isNotNull } from "drizzle-orm";
import { sendNotification } from "./notification";

/**
 * Check and update expired subscriptions
 * This function should be called periodically (e.g., daily via cron job)
 */
export async function checkAndUpdateExpiredSubscriptions() {
  console.log("[SUBSCRIPTION EXPIRY] Starting expired subscription check...");

  try {
    // Find subscriptions that have passed their next_payment_date and are still active
    const expiredSubscriptions = await db.query.subscription.findMany({
      where: and(
        isNotNull(subscription.next_payment_at),
        lt(subscription.next_payment_at, new Date()),
        eq(subscription.active, true)
      ),
      with: { user: true },
    });

    console.log(`[SUBSCRIPTION EXPIRY] Found ${expiredSubscriptions.length} expired subscriptions`);

    if (expiredSubscriptions.length === 0) {
      console.log("[SUBSCRIPTION EXPIRY] No expired subscriptions found");
      return { processed: 0, errors: [] };
    }

    const errors: string[] = [];
    let processed = 0;

    for (const sub of expiredSubscriptions) {
      try {
        console.log(`[SUBSCRIPTION EXPIRY] Processing expired subscription: ${sub.id}`);

        // Update subscription status
        await db
          .update(subscription)
          .set({
            active: false,
            expired: true,
            status: "failed",
          })
          .where(eq(subscription.id, sub.id));

        // Send expiration notification
        if (sub.user_id) {
          await sendNotification(sub.user_id, {
            title: "Subscription Expired",
            type: "subscription",
            message: "Your subscription has expired. Please renew your subscription to continue your service.",
          }).catch((error) => {
            console.error(`[SUBSCRIPTION EXPIRY] Failed to send notification for subscription ${sub.id}:`, error);
            errors.push(`Notification failed for subscription ${sub.id}: ${error}`);
          });
        }

        processed++;
        console.log(`[SUBSCRIPTION EXPIRY] Successfully processed expired subscription: ${sub.id}`);

      } catch (error) {
        console.error(`[SUBSCRIPTION EXPIRY] Error processing subscription ${sub.id}:`, error);
        errors.push(`Failed to process subscription ${sub.id}: ${error}`);
      }
    }

    console.log(`[SUBSCRIPTION EXPIRY] Completed processing. Processed: ${processed}, Errors: ${errors.length}`);

    return { processed, errors };

  } catch (error) {
    console.error("[SUBSCRIPTION EXPIRY] Error in expired subscription check:", error);
    throw error;
  }
}

/**
 * Get subscription status summary
 */
export async function getSubscriptionStatusSummary() {
  try {
    const allSubscriptions = await db.query.subscription.findMany();
    
    const summary = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(sub => sub.active).length,
      expired: allSubscriptions.filter(sub => sub.expired).length,
      cancelled: allSubscriptions.filter(sub => sub.cancelled).length,
      pending: allSubscriptions.filter(sub => sub.status === "pending").length,
      failed: allSubscriptions.filter(sub => sub.status === "failed").length,
      success: allSubscriptions.filter(sub => sub.status === "success").length,
    };

    return summary;
  } catch (error) {
    console.error("[SUBSCRIPTION SUMMARY] Error getting subscription summary:", error);
    throw error;
  }
}

/**
 * Check if a subscription is expired based on next_payment_date
 */
export function isSubscriptionExpired(subscription: any): boolean {
  if (!subscription.next_payment_at) return false;
  
  const nextPaymentDate = new Date(subscription.next_payment_at);
  const currentDate = new Date();
  
  return nextPaymentDate < currentDate;
}

/**
 * Get days until subscription expires
 */
export function getDaysUntilExpiry(subscription: any): number | null {
  if (!subscription.next_payment_at) return null;
  
  const nextPaymentDate = new Date(subscription.next_payment_at);
  const currentDate = new Date();
  
  const diffTime = nextPaymentDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
} 