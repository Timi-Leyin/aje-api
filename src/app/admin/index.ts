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
  advertisement,
} from "../../db/schema";
import {
  comaprePassword as comparePassword,
  generateJWT,
} from "../../helpers/secrets";
import { and, eq, desc, not, isNotNull } from "drizzle-orm";
import { loginSchema } from "./validator";
import { jwt } from "hono/jwt";
import { usersRoutes } from "./subroutes/users";
import { adsRoutes } from "./subroutes/ads";

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

// Dashboard statistics endpoint with additional verification statistics
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
      advertisementsCount,
    ] = await Promise.all([
      db.select({ count: users.id }).from(users),
      db.select({ count: property.id }).from(property),
      db.select({ count: product.id }).from(product),
      db.select({ count: docsVerification.id }).from(docsVerification),
      db.select({ count: review.id }).from(review),
      db.select({ count: files.id }).from(files),
      db.select({ count: transaction.id }).from(transaction),
      db.select({ count: advertisement.id }).from(advertisement),
    ]);

    // Verification statistics
    const pendingVerifications = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.verification_status, "pending"));

    // Recent users - get last 5 users
    const _users = await db.query.users.findMany({
      where: not(eq(users.user_type, "admin")),
      orderBy: desc(users.created_at),
      limit: 5,
    });

    const recentUsers = _users.map(({ password, ...rest }) => rest);

    // Recent verification requests - get last 5
    const recentVerifications = await db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        verification_status: users.verification_status,
        user_type: users.user_type,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(isNotNull(users.verification_status))
      .orderBy(desc(users.updated_at))
      .limit(5); // Recent transactions - get last 5 transactions
    const recentTransactions = await db
      .select()
      .from(transaction)
      .orderBy(desc(transaction.created_at))
      .limit(5);

    // Recent advertisements - get last 5 ads
    const recentAds = await db.query.advertisement.findMany({
      orderBy: desc(advertisement.created_at),
      limit: 5,
      with: {
        images: true,
      },
    });

    return c.json({
      counts: {
        users: usersCount.length,
        properties: propertiesCount.length,
        products: productsCount.length,
        verifications: verificationsCount.length,
        pendingVerifications: pendingVerifications.length,
        reviews: reviewsCount.length,
        files: filesCount.length,
        transactions: transactionsCount.length,
        advertisements: advertisementsCount.length,
      },
      recentUsers,
      recentVerifications,
      recentTransactions,
      recentAds,
    });
  } catch (error) {
    return c.json({ message: "Error fetching dashboard data", error }, 500);
  }
});

adminRoutes.route("/ads", adsRoutes);
adminRoutes.route("/users", usersRoutes);

export { adminRoutes };
