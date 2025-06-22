import { db } from "../db";
import { subscription, transaction, users } from "../db/schema";
import { eq } from "drizzle-orm";

async function debugSubscription(userId: string) {
  console.log(`\n=== DEBUGGING SUBSCRIPTION FOR USER ${userId} ===\n`);

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("👤 USER DETAILS:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Name: ${user.first_name} ${user.last_name}`);
  console.log(`   User Type: ${user.user_type}`);
  console.log(`   Subscription ID: ${user.subscription_id || "None"}`);

  // Get all subscriptions for this user
  const subscriptions = await db.query.subscription.findMany({
    where: eq(subscription.user_id, userId),
    orderBy: (subscription, { desc }) => [desc(subscription.created_at)],
  });

  console.log(`\n📋 SUBSCRIPTIONS (${subscriptions.length} total):`);
  
  if (subscriptions.length === 0) {
    console.log("   No subscriptions found");
  } else {
    subscriptions.forEach((sub, index) => {
      console.log(`\n   ${index + 1}. Subscription ${sub.id}:`);
      console.log(`      Plan: ${sub.plan_name} (${sub.plan_code})`);
      console.log(`      Amount: ₦${sub.amount}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Active: ${sub.active ? "✅" : "❌"}`);
      console.log(`      Cancelled: ${sub.cancelled ? "✅" : "❌"}`);
      console.log(`      Expired: ${sub.expired ? "✅" : "❌"}`);
      console.log(`      Paid At: ${sub.paid_at || "Not paid"}`);
      console.log(`      Next Payment: ${sub.next_payment_at || "Not set"}`);
      console.log(`      Paystack Code: ${sub.code || "Not set"}`);
      console.log(`      Created: ${sub.created_at}`);
      console.log(`      Updated: ${sub.updated_at}`);
    });
  }

  // Get all transactions for this user
  const transactions = await db.query.transaction.findMany({
    where: eq(transaction.user_id, userId),
    orderBy: (transaction, { desc }) => [desc(transaction.created_at)],
  });

  console.log(`\n💰 TRANSACTIONS (${transactions.length} total):`);
  
  if (transactions.length === 0) {
    console.log("   No transactions found");
  } else {
    transactions.forEach((trx, index) => {
      console.log(`\n   ${index + 1}. Transaction ${trx.id}:`);
      console.log(`      Plan Code: ${trx.plan_code}`);
      console.log(`      Amount: ₦${trx.amount}`);
      console.log(`      Status: ${trx.status}`);
      console.log(`      Paid At: ${trx.paid_at || "Not paid"}`);
      console.log(`      Fee: ₦${trx.fee || 0}`);
      console.log(`      Subscription ID: ${trx.subscription_id || "None"}`);
      console.log(`      Created: ${trx.created_at}`);
    });
  }

  // Check for issues
  console.log(`\n🔍 POTENTIAL ISSUES:`);
  
  const activeSubscriptions = subscriptions.filter(sub => sub.active);
  const pendingSubscriptions = subscriptions.filter(sub => sub.status === "pending");
  const cancelledSubscriptions = subscriptions.filter(sub => sub.cancelled);

  if (activeSubscriptions.length === 0 && user.subscription_id) {
    console.log("   ⚠️  User has subscription_id but no active subscriptions");
  }

  if (activeSubscriptions.length > 1) {
    console.log("   ⚠️  Multiple active subscriptions found");
  }

  if (pendingSubscriptions.length > 0) {
    console.log("   ⚠️  Pending subscriptions found - may need webhook processing");
  }

  if (cancelledSubscriptions.length > 0) {
    console.log("   ⚠️  Cancelled subscriptions found");
  }

  if (subscriptions.length === 0) {
    console.log("   ℹ️  No subscriptions found - user may need to subscribe");
  }

  console.log(`\n=== END DEBUG ===\n`);
}

// Export for use in other files
export { debugSubscription };

// If running directly, you can uncomment and modify this:
// const userId = "your-user-id-here";
// debugSubscription(userId).catch(console.error); 