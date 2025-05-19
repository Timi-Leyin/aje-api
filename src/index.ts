import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRoutes from "./app/auth";
import propertyRoutes from "./app/property";
import profileRoutes from "./app/profile";
import { jwt, JwtVariables } from "hono/jwt";
import { eq, InferModel } from "drizzle-orm";
import { db } from "./db";
import { files, subscription, users } from "./db/schema";
import artisanRoutes from "./app/artisan";
import marketplaceRoutes from "./app/marketplace";
import reviewsRoutes from "./app/review";
import webhooksRoutes from "./app/webhook";
import plansRoutes from "./app/plan";
import notificationsRoutes from "./app/notification";
import reportRoutes from "./app/report"

const app = new Hono();

app.use(logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", authRoutes);

type Users = InferModel<typeof users>;
type Files = InferModel<typeof files>;
type Sub = InferModel<typeof subscription>;
type VAR = Users & { profile_photo: Files; subscription: Sub };
export type Variables = JwtVariables<VAR>;

app.route("/paystack", webhooksRoutes);
// PROTECTED
app.use(
  "/*",
  jwt({
    secret: process.env.JWT_SECRET,
  }),
  async (c, next) => {
    const { id } = c.get("jwtPayload");
    const profile = await db.query.users.findFirst({
      where: eq(users.id, id),
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
app.route("/property", propertyRoutes);
app.route("/profile", profileRoutes);
app.route("/artisan", artisanRoutes);
app.route("/marketplace", marketplaceRoutes);
app.route("/review", reviewsRoutes);
app.route("/plan", plansRoutes);
app.route("/notification", notificationsRoutes);
app.route("/report", reportRoutes);

serve(
  {
    fetch: app.fetch,
    port: 7000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
