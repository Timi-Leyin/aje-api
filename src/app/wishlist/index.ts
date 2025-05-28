import { Hono } from "hono";
import { Variables } from "../..";
import { db } from "../../db";
import { and, eq } from "drizzle-orm";
import { wishlist } from "../../db/schema";

const wishlistRoutes = new Hono<{ Variables: Variables }>();

wishlistRoutes.get("/", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");

    const wishlists = await db.query.wishlist.findMany({
      where: eq(wishlist.user_id, user_id),
      with: {
        products: true,
        properties: true,
      },
    });

    return c.json({ message: "Wishlist Retrived", data: wishlists });
  } catch (error) {
    return c.json({ message: "Internal server Error" }, 500);
  }
});
wishlistRoutes.delete("/:id", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");
    const id = c.req.param("id");
    await db
      .delete(wishlist)
      .where(and(eq(wishlist.user_id, user_id), eq(wishlist.id, id)));

    return c.json({ message: "Wishlist Deleted" });
  } catch (error) {
    return c.json({ message: "Internal server Error" }, 500);
  }
});

export default wishlistRoutes;
