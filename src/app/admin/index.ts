import { Hono } from "hono";
import { db } from "../../db";
import {
  users,
  property,
  product,
  docsVerification,
  review,
  files,
  transaction,
} from "../../db/schema";
import {
  comaprePassword as comparePassword,
  generateJWT,
} from "../../helpers/secrets";
import { and, eq, desc } from "drizzle-orm";
import { loginSchema } from "./validator";
import { jwt } from "hono/jwt";

const adminRoutes = new Hono();

adminRoutes.post("/login", loginSchema, async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const adminUser = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.user_type, "admin")),
    });

    if (!adminUser) {
      return c.json(
        {
          message: "Invalid email or password",
        },
        401
      );
    }

    const isValidPassword = await comparePassword(
      password,
      adminUser.password as string
    );

    if (!isValidPassword) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        401
      );
    }

    const token = await generateJWT({
      id: adminUser.id,
    });

    return c.json({
      message: "Login successful",
      token,
    });
  } catch (error: any) {
    return c.json(
      {
        message: "Login failed",
      },
      500
    );
  }
});

adminRoutes.use(
  "/*",
  jwt({
    secret: process.env.JWT_SECRET,
  }),
  async (c, next) => {
    const { id } = c.get("jwtPayload");
    const profile = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.user_type, "admin")),
      with: {
        profile_photo: true,
        // gallery:true,
        subscription: true,
        properties: true,
      },
    });

    if (!profile) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    // const sub = await db.query.subscription.findMany({
    //   where: eq(subscription.user_id, profile?.id),
    // });

    // console.log(profile.subscription);
    const { password, ...rest } = profile as any;
    c.set("jwtPayload", rest);
    await next();
  }
);

// Dashboard statistics endpoint
adminRoutes.get("/dashboard", async (c) => {
  try {
    const [
      usersCount,
      propertiesCount,
      productsCount,
      verificationsCount,
      reviewsCount,
      filesCount,
      transactionsCount,
    ] = await Promise.all([
      db.select({ count: users.id }).from(users),
      db.select({ count: property.id }).from(property),
      db.select({ count: product.id }).from(product),
      db.select({ count: docsVerification.id }).from(docsVerification),
      db.select({ count: review.id }).from(review),
      db.select({ count: files.id }).from(files),
      db.select({ count: transaction.id }).from(transaction),
    ]); // Recent users - get last 5 users
    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(5);

    // Recent transactions - get last 5 transactions
    const recentTransactions = await db
      .select()
      .from(transaction)
      .orderBy(desc(transaction.created_at))
      .limit(5);

    return c.json({
      counts: {
        users: usersCount.length ? usersCount[0].count : 0,
        properties: propertiesCount.length ? propertiesCount[0].count : 0,
        products: productsCount.length ? productsCount[0].count : 0,
        verifications: verificationsCount.length
          ? verificationsCount[0].count
          : 0,
        reviews: reviewsCount.length ? reviewsCount[0].count : 0,
        files: filesCount.length ? filesCount[0].count : 0,
        transactions: transactionsCount.length ? transactionsCount[0].count : 0,
      },
      recentUsers,
      recentTransactions,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return c.json({ message: "Error fetching dashboard data", error }, 500);
  }
});

export { adminRoutes };
