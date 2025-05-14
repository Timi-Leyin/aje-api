import { Hono } from "hono";
import { Variables } from "../..";
import { db } from "../../db";
import { nanoid } from "nanoid";
import { product, property, review, users } from "../../db/schema";
import { and, eq } from "drizzle-orm";

const reviewsRoutes = new Hono<{ Variables: Variables }>();

reviewsRoutes.post("/:id", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");
    const paramId = c.req.param("id");
    const { rating, message, type } = await c.req.json();
    if (!rating && !message)
      return c.json({ message: "Rating or Message is required" }, 400);
    if (!type) {
      return c.json({ message: "Type must be property|product|artisan" }, 400);
    }

    if (type == "property") {
      const query = await db.query.property.findFirst({
        where: eq(property.id, paramId),
      });
      if (!query) return c.json({ message: "Property Not FOund" }, 404);
      const id = nanoid();
      await db.insert(review).values({
        id,
        user_id,
        rating,
        message,
        property_id: paramId,
      });
    }

    if (type == "product") {
      const query = await db.query.product.findFirst({
        where: eq(product.id, paramId),
      });
      if (!query) return c.json({ message: "product Not FOund" }, 404);
      const id = nanoid();
      await db.insert(review).values({
        id,
        user_id,
        rating,
        message,
        product_id: paramId,
      });
    }

    if (type == "artisan") {
      const query = await db.query.users.findFirst({
        where: and(eq(users.id, paramId), eq(users.user_type, "artisan")),
      });

      if (!query) return c.json({ message: "Artisan Not FOund" }, 404);
      const id = nanoid();
      await db.insert(review).values({
        id,
        user_id,
        rating,
        message,
        artisan_id: paramId,
      });
    }

    return c.json({ message: "Reviewed" });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default reviewsRoutes;
