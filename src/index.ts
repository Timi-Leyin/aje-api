import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { db } from "./db/index";
import { usersTable } from "./db/schema";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

serve(
  {
    fetch: app.fetch,
    port: 7000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
