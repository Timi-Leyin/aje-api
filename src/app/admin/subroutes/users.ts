import { Hono } from "hono";
import { db } from "../../../db";
import {
  users,
  docsVerification,
  property,
  files,
  review,
  subscription,
} from "../../../db/schema";
import { eq, desc, and, isNotNull, sql, or } from "drizzle-orm";
import { hashPassword } from "../../../helpers/secrets";
import { MAX_LIMIT_DATA } from "../../../constants";
import { updateUserSchema } from "../validator";
import { nanoid } from "nanoid";
import { sendNotification } from "../../../helpers/notification";

const usersRoutes = new Hono();

usersRoutes.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "30",
      email,
      verified,
      user_type,
    } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    if (email) {
      filters.push(eq(users.email, email));
    }

    if (verified && verified != "all") {
      filters.push(eq(users.verified, verified == "true"));
    }

    if (user_type) {
      filters.push(eq(users.user_type, user_type as any));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [allUsers, total] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        with: {
          verification: true,
          //   gallery: true,
          profile_photo: true,
        },
        limit: limitNumber,
        offset: offset,
        orderBy: sql`RAND()`,
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      data: allUsers,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching users", error: error.message },
      500
    );
  }
});

usersRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        profile_photo: true,
        subscription: true,
      },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    return c.json({
      data: user,
      message: "User fetched successfully",
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching user", error: error.message },
      500
    );
  }
});

usersRoutes.put("/:id", updateUserSchema, async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    await db.update(users).set(data).where(eq(users.id, id));

    const updatedUser = await db.select().from(users).where(eq(users.id, id));

    if (!updatedUser.length) {
      return c.json({ message: "User not found" }, 404);
    }

    return c.json({
      message: "User updated successfully",
      data: updatedUser[0],
    });
  } catch (error: any) {
    return c.json(
      { message: "Error updating user", error: error.message },
      500
    );
  }
});

usersRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Delete related records first
    await db.delete(files).where(eq(files.user_id as any, id));
    await db.delete(property).where(eq(property.user_id as any, id));
    await db.delete(review).where(eq(review.user_id as any, id));
    await db.delete(review).where(eq(review.artisan_id as any, id));
    await db.delete(subscription).where(eq(subscription.user_id as any, id));

    // Then delete the user
    await db.delete(users).where(eq(users.id, id));

    return c.json({
      message: "User and associated data deleted successfully",
    });
  } catch (error: any) {
    return c.json(
      { message: "Error deleting user", error: error.message },
      500
    );
  }
});

usersRoutes.put("/:id/verification", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, adminNotes } = await c.req.json();

    if (!["pending", "verified", "rejected"].includes(status)) {
      return c.json({ message: "Invalid verification status" }, 400);
    }

    // Update user verification status
    await db
      .update(users)
      .set({
        verification_status: status as any,
        verified: status === "verified",
      })
      .where(eq(users.id, id));

    // Find or create verification record to store admin notes
    const existingVerification = await db
      .select()
      .from(docsVerification)
      .where(eq(docsVerification.user_id, id));

    if (existingVerification.length > 0) {
      if (adminNotes) {
        await db
          .update(docsVerification)
          .set({
            note: adminNotes,
          })
          .where(eq(docsVerification.id, existingVerification[0].id));
      }
    } else if (status !== "pending") {
      // Create new verification record if none exists and status is changing
      await db.insert(docsVerification).values({
        id: nanoid(),
        user_id: id,
        note: adminNotes,
      });
    }

    // Send different notification messages based on verification status
    let notificationTitle = "Verification Status Updated";
    let notificationMessage = "";

    if (status === "verified") {
      notificationMessage =
        "Congratulations! Your account has been successfully verified.";
    } else if (status === "rejected") {
      notificationMessage =
        "Your verification request was not approved. Please check make sure your documents are valid.";
    } else if (status === "pending") {
      notificationMessage = "Your verification request is now pending review.";
    }

    await sendNotification(id, {
      title: notificationTitle,
      type:"security",
      message: notificationMessage,
    }).catch((error) => console.log("Failed to send notification"));

    return c.json({
      message: `User verification status changed to ${status}`,
    });
  } catch (error: any) {
    return c.json(
      { message: "Error updating verification status", error: error.message },
      500
    );
  }
});

usersRoutes.get("/stats/overview", async (c) => {
  try {
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;

    // Count by verification status
    const verifiedUsers = allUsers.filter((u) => u.verified).length;
    const unverifiedUsers = totalUsers - verifiedUsers;

    // Count by user type
    const userTypeMap = new Map();

    allUsers.forEach((user) => {
      if (user.user_type) {
        const count = userTypeMap.get(user.user_type) || 0;
        userTypeMap.set(user.user_type, count + 1);
      }
    });

    const userTypeStats = Array.from(userTypeMap, ([type, count]) => ({
      type,
      count,
    }));

    return c.json({
      total: totalUsers,
      verified: verifiedUsers,
      unverified: unverifiedUsers,
      byType: userTypeStats,
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching user statistics", error: error.message },
      500
    );
  }
});

usersRoutes.get("/verification/requests", async (c) => {
  try {
    const { page = "1", limit = "30", status, user_type } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [isNotNull(users.verification_status)];

    console.log(status);
    if (status && status != "all") {
      filters.push(eq(users.verification_status, status as any));
    }

    if (user_type) {
      filters.push(eq(users.user_type, user_type as any));
    }

    const whereClause = and(...filters);

    const [verificationRequests, total] = await Promise.all([
      db.query.users.findMany({
        where: whereClause,
        with: {
          profile_photo: true,
          verification: {
            with: {
              cacDocs: true,
              ninDocs: true,
            },
          },
        },
        limit: limitNumber,
        offset: offset,
        orderBy: [desc(users.updated_at)],
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      data: verificationRequests,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    return c.json({ message: "Error fetching verification requests" }, 500);
  }
});

export { usersRoutes };
