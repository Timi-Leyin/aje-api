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
import { files, users } from "./db/schema";
import artisanRoutes from "./app/artisan";
import marketplaceRoutes from "./app/marketplace";

const app = new Hono();

app.use(logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", authRoutes);

type Users = InferModel<typeof users>;
type Files = InferModel<typeof files>;
type VAR = Users & { profile_photo: Files };
export type Variables = JwtVariables<VAR>;
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
        properties: true,
      },
    });

    if (!profile) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    const { password, ...rest } = profile as any;
    c.set("jwtPayload", rest);
    await next();
  }
);
app.route("/property", propertyRoutes);
app.route("/profile", profileRoutes);
app.route("/artisan", artisanRoutes);
app.route("/marketplace", marketplaceRoutes);

serve(
  {
    fetch: app.fetch,
    port: 7000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
