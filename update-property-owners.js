const { updatePropertyOwners } = require('./src/scripts/update-property-owners.ts');

// Get the target user ID from command line arguments
const targetUserId = process.argv[2] || "-jmgOVvnzfNpT7l3V9E63";

console.log("Starting property owner update...");
console.log(`Target User ID: ${targetUserId}`);

updatePropertyOwners(targetUserId)
  .then((result) => {
    console.log("✅ Script completed successfully!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 