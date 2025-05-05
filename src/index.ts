import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRoutes from "./app/auth";
import propertyRoutes from "./app/property";
import profileRoutes from "./app/profile";

const app = new Hono();

app.use(logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", authRoutes);
app.route("/property", propertyRoutes);
app.route("/profile", profileRoutes);

serve(
  {
    fetch: app.fetch,
    port: 7000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
