import { Hono } from "hono";
import { Variables } from "../..";
import { notification } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { MAX_LIMIT_DATA } from "../../constants";

const notificationsRoutes = new Hono<{ Variables: Variables }>();

notificationsRoutes.get("/", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");
    const { page = "1", limit = "100" } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    // const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const whereClause = eq(notification.user_id, user_id);

    const [notifications, total] = await Promise.all([
      db.query.notification.findMany({
        where: whereClause,
        limit: limitNumber,
        offset: offset,
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notification)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      message: "notifications retrieved",
      data: notifications,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default notificationsRoutes;
