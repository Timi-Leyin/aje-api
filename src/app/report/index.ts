import { Hono } from "hono";
import { Variables } from "../..";
import { notification, report } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { MAX_LIMIT_DATA } from "../../constants";
import { newReportValidator } from "./validator";
import { nanoid } from "nanoid";

const reportRoutes = new Hono<{ Variables: Variables }>();

reportRoutes.post("/", newReportValidator, async (c) => {
  try {
    const { category, artisan_id, details, product_id, property_id } =
      c.req.valid("json");
    await db.insert(report).values({
      id: nanoid(),
      category,
      details,
      artisan_id,
      product_id,
      property_id,
    });
    return c.json({ message: "Report successful" });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default reportRoutes;
