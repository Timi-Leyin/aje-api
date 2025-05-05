import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import authRoutes from "./app/auth";

const app = new Hono();

app.use(logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/auth", authRoutes);

serve(
  {
    fetch: app.fetch,
    port: 7000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
