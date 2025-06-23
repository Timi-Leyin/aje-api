import "dotenv/config";
import { checkAndUpdateExpiredSubscriptions, getSubscriptionStatusSummary } from "../helpers/subscription";

async function main() {
  console.log("🚀 Starting expired subscription check script...");

  try {
    // Get current subscription summary
    console.log("\n📊 Current subscription status:");
    const beforeSummary = await getSubscriptionStatusSummary();
    console.log(beforeSummary);

    // Check and update expired subscriptions
    console.log("\n🔄 Checking for expired subscriptions...");
    const result = await checkAndUpdateExpiredSubscriptions();

    console.log("\n✅ Expired subscription check completed!");
    console.log("Result:", result);

    // Get updated subscription summary
    console.log("\n📊 Updated subscription status:");
    const afterSummary = await getSubscriptionStatusSummary();
    console.log(afterSummary);

    // Show changes
    console.log("\n📈 Changes made:");
    console.log(`   Active subscriptions: ${beforeSummary.active} → ${afterSummary.active}`);
    console.log(`   Expired subscriptions: ${beforeSummary.expired} → ${afterSummary.expired}`);
    console.log(`   Failed subscriptions: ${beforeSummary.failed} → ${afterSummary.failed}`);

    if (result.processed > 0) {
      console.log(`\n🎯 Successfully processed ${result.processed} expired subscriptions`);
    } else {
      console.log("\n✅ No expired subscriptions found");
    }

    if (result.errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error("❌ Error in expired subscription check:", error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }); 