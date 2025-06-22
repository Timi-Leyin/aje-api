import "dotenv/config";
import { db } from "../db";
import { property, users } from "../db/schema";
import { eq, isNotNull } from "drizzle-orm";

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  console.error("Please make sure you have a .env file with DATABASE_URL set");
  process.exit(1);
}

export async function updatePropertyOwners(targetUserId?: string) {
  // Get target user ID from command line arguments or use default
  const TARGET_USER_ID = targetUserId || process.argv[2] || "-jmgOVvnzfNpT7l3V9E63";

  console.log("🚀 Starting property owner update script...");
  console.log(`📋 Target User ID: ${TARGET_USER_ID}`);

  if (!TARGET_USER_ID) {
    console.error("❌ Please provide a target user ID as a command line argument");
    console.error("Usage: yarn script:update-property-owners <USER_ID>");
    console.error("Example: yarn script:update-property-owners -jmgOVvnzfNpT7l3V9E63");
    throw new Error("Target user ID is required");
  }

  try {
    // First, verify the target user exists
    console.log("🔍 Verifying target user exists...");
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, TARGET_USER_ID),
    });

    if (!targetUser) {
      console.error("❌ Target user not found!");
      console.error(`User ID: ${TARGET_USER_ID}`);
      throw new Error(`Target user not found: ${TARGET_USER_ID}`);
    }

    console.log("✅ Target user found:");
    console.log(`   Name: ${targetUser.first_name} ${targetUser.last_name}`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   User Type: ${targetUser.user_type}`);

    // Get current property count
    console.log("\n📊 Getting current property statistics...");
    const allProperties = await db.query.property.findMany();
    const propertiesWithOwners = await db.query.property.findMany({
      where: isNotNull(property.user_id),
    });

    console.log(`   Total properties: ${allProperties.length}`);
    console.log(`   Properties with owners: ${propertiesWithOwners.length}`);
    console.log(`   Properties without owners: ${allProperties.length - propertiesWithOwners.length}`);

    // Get properties that need to be updated (those with different owners or no owners)
    console.log("\n🔍 Finding properties to update...");
    const propertiesToUpdate = await db.query.property.findMany({
      where: eq(property.user_id, TARGET_USER_ID),
    });

    const propertiesWithDifferentOwners = allProperties.filter(
      (prop) => prop.user_id && prop.user_id !== TARGET_USER_ID
    );

    console.log(`   Properties already owned by target user: ${propertiesToUpdate.length}`);
    console.log(`   Properties with different owners: ${propertiesWithDifferentOwners.length}`);

    if (propertiesWithDifferentOwners.length === 0) {
      console.log("✅ No properties need to be updated!");
      return { success: true, message: "No properties need to be updated" };
    }

    // Show current owners
    console.log("\n👥 Current property owners:");
    const ownerCounts = new Map<string, number>();
    for (const prop of propertiesWithDifferentOwners) {
      if (prop.user_id) {
        ownerCounts.set(prop.user_id, (ownerCounts.get(prop.user_id) || 0) + 1);
      }
    }

    for (const [ownerId, count] of ownerCounts) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, ownerId),
      });
      const ownerName = owner ? `${owner.first_name} ${owner.last_name} (${owner.email})` : `Unknown User (${ownerId})`;
      console.log(`   ${ownerName}: ${count} properties`);
    }

    // Confirm the update
    console.log(`\n⚠️  This will update ${propertiesWithDifferentOwners.length} properties to be owned by ${targetUser.first_name} ${targetUser.last_name}`);
    console.log("Press Ctrl+C to cancel or wait 5 seconds to continue...");

    // Wait 5 seconds for confirmation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Update all properties to the target user
    console.log("\n🔄 Updating property owners...");
    
    const updateResult = await db
      .update(property)
      .set({
        user_id: TARGET_USER_ID,
      })
      .where(isNotNull(property.user_id));

    console.log(`✅ Successfully updated properties!`);

    // Verify the update
    console.log("\n🔍 Verifying the update...");
    const updatedProperties = await db.query.property.findMany({
      where: eq(property.user_id, TARGET_USER_ID),
    });

    const propertiesWithoutOwners = await db.query.property.findMany({
      where: eq(property.user_id, null as any),
    });

    console.log(`   Properties now owned by target user: ${updatedProperties.length}`);
    console.log(`   Properties without owners: ${propertiesWithoutOwners.length}`);

    // Show some sample updated properties
    console.log("\n📋 Sample updated properties:");
    const sampleProperties = updatedProperties.slice(0, 5);
    for (const prop of sampleProperties) {
      console.log(`   - ${prop.title} (${prop.city || 'No city'}) - ${prop.price} ${prop.currency}`);
    }

    if (updatedProperties.length > 5) {
      console.log(`   ... and ${updatedProperties.length - 5} more properties`);
    }

    console.log("\n✅ Property owner update completed successfully!");
    console.log(`🎯 All properties are now owned by: ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email})`);

    return {
      success: true,
      message: "Property owner update completed successfully",
      targetUser: {
        id: targetUser.id,
        name: `${targetUser.first_name} ${targetUser.last_name}`,
        email: targetUser.email,
      },
      updatedCount: updatedProperties.length,
    };

  } catch (error) {
    console.error("❌ Error updating property owners:", error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  updatePropertyOwners()
    .then((result) => {
      console.log("\n🎉 Script completed successfully!");
      console.log("Result:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
} 