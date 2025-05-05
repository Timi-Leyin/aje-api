import { Hono } from "hono";
import { createPropertyValidator } from "./validator";
import { uploadFiles } from "../../helpers/files";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { amenity, property } from "../../db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

const propertyRoutes = new Hono();

propertyRoutes.post("/", createPropertyValidator, async (c) => {
  const {
    images,
    city,
    address,
    currency,
    description,
    bathrooms,
    bedrooms,
    beds,
    lat,
    lon,
    price,
    type,
    title,
    amenities,
    listingType,
    schedule,
  } = c.req.valid("form");

  try {
    let getAmentities: string[];

    try {
      getAmentities = JSON.parse(amenities || "[]");
    } catch (error) {
      console.log(">", "skipping amenities");
    }

    const id = nanoid();

    await db.insert(property).values({
      id,
      currency: currency,
      description,
      title,
      price: Number(price),
      bedrooms: Number(bedrooms),
      beds: Number(beds),
      bathrooms: Number(bathrooms),
      lat: Number(lat),
      lon: Number(lon),
      city,
      type,
      listingType,
      address,
    });

    await uploadFiles(images, {
      property_id: id,
    });

    return c.json({ message: "Property Created", id });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

propertyRoutes.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "10",
      city,
      type,
      listingType,
      minPrice,
      maxPrice,
      search,
    } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    if (city) filters.push(eq(property.city, city));
    if (type) filters.push(eq(property.type, type));
    if (listingType) filters.push(eq(property.listingType, listingType));
    if (minPrice) filters.push(gte(property.price, parseFloat(minPrice)));
    if (maxPrice) filters.push(lte(property.price, parseFloat(maxPrice)));
    // if (search) {
    //     filters.push(
    //       sql`MATCH (title, description) AGAINST (${`${search}*`} IN BOOLEAN MODE)`
    //     );
    //   }

    const whereClause = filters.length ? and(...filters) : undefined;

    const [properties, total] = await Promise.all([
      db.query.property.findMany({
        where: whereClause,
        limit: limitNumber,
        offset: offset,
        orderBy: sql`RAND()`,
        with: {
          images: {
            limit: 5,
          },
        },
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(property)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      message: "Properties retrieved",
      data: properties,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default propertyRoutes;
