import { Hono } from "hono";
import { Variables } from "../..";
import { MAX_LIMIT_DATA } from "../../constants";
import { and, eq, like, or, sql } from "drizzle-orm";
import { users } from "../../db/schema";
import { db } from "../../db";
import { getActiveSubscription } from "../../helpers/subscription";

const artisanRoutes = new Hono<{ Variables: Variables }>();

artisanRoutes.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "30",
      location,
      services,
      search,
    } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    // BUILD QUERY
    if (location) {
      const words = location.trim().split(/\s+/).filter(Boolean); // ["Ikeja", "Lagos"]
      const conditions = words.map((word) => like(users.address, `%${word}%`));
      filters.push(or(...conditions));
    }

    if (services) {
      const words = services.trim().split(",").filter(Boolean); // ["Ikeja", "Lagos"]
      const conditions = words.map((word) => like(users.services, `%${word}%`));
      filters.push(or(...conditions));
    }

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const fieldMatches = words.map((word) =>
        or(
          like(users.city, `%${word}%`),
          like(users.services, `%${word}%`),
          like(users.address, `%${word}%`),
          like(users.bio, `%${word}%`),
          like(users.first_name, `%${word}%`),
          like(users.last_name, `%${word}%`)
        )
      );

      filters.push(or(...fieldMatches));
    }
    const whereClause = filters.length ? or(...filters) : undefined;

    const [artisans, total] = await Promise.all([
      db.query.users.findMany({
        where: and(eq(users.user_type, "artisan"), whereClause),
        with: {
          //   gallery: true,
          profile_photo: true,
        },
        limit: limitNumber,
        offset: offset,
        orderBy: sql`RAND()`,
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(and(eq(users.user_type, "artisan"), whereClause))
        .then((res) => res[0].count),
    ]);

    // Filter artisans by active subscription
    const filteredArtisans = [];
    for (const artisan of artisans) {
      const sub = await getActiveSubscription(artisan.id);
      if (sub && sub.active && !sub.expired && sub.status === "success") {
        filteredArtisans.push(artisan);
      }
    }

    return c.json({
      message: "Artisans retrieved",
      data: filteredArtisans,
      meta: {
        total: filteredArtisans.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(filteredArtisans.length / limitNumber),
      },
    });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

artisanRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const artisan = await db.query.users.findFirst({
      where: and(eq(users.user_type, "artisan"), eq(users.id, id)),
      with: {
        //   gallery: true,
        profile_photo: true,
        reviews: {
          with: {
            user: {
              columns: {
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      message: "Artisan Retrieved",
      data: artisan,
    });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default artisanRoutes;
