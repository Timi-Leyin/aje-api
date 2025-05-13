import { Hono } from "hono";
import { editPropertyValidator } from "./validator";
import { deleteFile, uploadFiles } from "../../helpers/files";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { files, property, schedule } from "../../db/schema";
import { and, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { Variables } from "../..";
import { PropertyFormData } from "./types";
import { MAX_LIMIT_DATA } from "../../constants";
import { ImageGroupType } from "../marketplace";

const propertyRoutes = new Hono<{ Variables: Variables }>();

propertyRoutes.post("/", async (c) => {
  const { id: user_id } = c.get("jwtPayload");
  // const forms = c.req.valid("form");
  const forms = (await c.req.parseBody()) as any;

  try {
    if (!forms?.images || !forms?.json) {
      return c.json({ message: "All fields are required" }, 400);
    }

    const json = JSON.parse(forms.json) as PropertyFormData;

    const amenities = json.amenities || [];
    const id = nanoid();

    await db.insert(property).values({
      id,
      currency: json.currency.toLowerCase() as any,
      description: json.description,
      title: json.title,
      price: Number(json.price),
      bedrooms: Number(json.bedrooms),
      beds: Number(json.bed),
      bathrooms: Number(json.bathrooms),
      lat: Number(json.lat),
      lon: Number(json.lon),
      amenities: amenities.join(","),
      city: json.city,

      youtube_link: json.youtube,
      type: json.type.toLowerCase(),
      listingType: json.listingType,
      address: json.address,
      user_id,
    });

    await uploadFiles(forms.images, {
      property_id: id,
    });

    if (json.availability) {
      await Promise.all(
        Object.entries(json.availability).map(async ([key, value]) => {
          await db.insert(schedule).values({
            id: nanoid(),
            weekday: key,
            from: value?.from ? new Date(value?.from) : null,
            to: value?.to ? new Date(value?.to) : null,
            property_id: id,
          });
        })
      );
    }

    return c.json({ message: "Property Created", id });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

propertyRoutes.put("/:id", async (c) => {
  const { id: user_id } = c.get("jwtPayload");
  const paramId = c.req.param("id");
  // const forms = c.req.valid("form");
  const forms = (await c.req.parseBody()) as any;

  try {
    // if (!forms?.images || !forms?.json) {
    //   return c.json({ message: "All fields are required" }, 400);
    // }
    const json = JSON.parse(forms.json) as PropertyFormData;

    const amenities = json.amenities || [];

    const allImages = JSON.parse(
      forms?.otherImages || "[]"
    ) as ImageGroupType[];

    const flatten =
      allImages?.reduce((acc: any[], cur: any) => {
        return [...acc, ...cur.images];
      }, []) || [];

    const previouslyUploaded = await db.query.files.findMany({
      where: eq(files.property_id, paramId),
    });

    const toBeDeleted = previouslyUploaded
      .map((prev) => {
        const isInFlat = flatten.some((a) => a.id === prev.id);
        if (!isInFlat) return prev;
      })
      .filter(Boolean);

    console.log(toBeDeleted);

    await Promise.all(
      toBeDeleted.map(async (de) => de && (await deleteFile(de.id)))
    );

    await db
      .update(property)
      .set({
        currency: json.currency.toLowerCase() as any,
        description: json.description,
        title: json.title,
        price: Number(json.price),
        bedrooms: Number(json.bedrooms),
        beds: Number(json.bed),
        bathrooms: Number(json.bathrooms),
        lat: Number(json.lat),
        lon: Number(json.lon),
        amenities: amenities.join(","),
        city: json.city,

        youtube_link: json.youtube,
        type: json.type.toLowerCase(),
        listingType: json.listingType,
        address: json.address,
        user_id,
      })
      .where(and(eq(property.id, paramId), eq(property.user_id, user_id)));

    await uploadFiles(forms.images || [], {
      property_id: paramId,
    });

    if (json.availability) {
      await db.delete(schedule).where(eq(schedule.property_id, paramId));
      // console.log(json.availability);
      await Promise.all(
        Object.entries(json.availability).map(async ([key, value]) => {
          await db.insert(schedule).values({
            id: nanoid(),
            weekday: key,
            from: !!value?.from ? new Date(value?.from) : null,
            to: !!value?.to ? new Date(value?.to) : null,
            property_id: paramId,
          });
        })
      );
    }

    return c.json({ message: "Property updated" });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

propertyRoutes.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "30",
      city,
      type,
      listingType,
      minPrice,
      amenities,
      bedrooms,
      bathrooms,
      maxPrice,
      search,
    } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    // const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    // BUILD QUERY
    if (type) filters.push(eq(property.type, type));
    if (listingType) filters.push(eq(property.listingType, listingType));
    if (minPrice) filters.push(gte(property.price, parseFloat(minPrice)));
    if (maxPrice) filters.push(lte(property.price, parseFloat(maxPrice)));
    if (bedrooms) filters.push(lte(property.bedrooms, parseFloat(bedrooms)));
    if (bathrooms) filters.push(lte(property.bathrooms, parseFloat(bathrooms)));
    if (city) {
      const words = city.trim().split(/\s+/).filter(Boolean); // ["Ikeja", "Lagos"]
      filters.push(like(property.city, `%${city}%`));
      const conditions = words.map((word) => like(property.city, `%${word}%`));
      filters.push(or(...conditions));
    }
    if (amenities) {
      const words = amenities.trim().split(",").filter(Boolean); // ["Ikeja", "Lagos"]
      const conditions = words.map((word) =>
        like(property.amenities, `%${word}%`)
      );
      filters.push(or(...conditions));
    }

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const fieldMatches = words.map((word) =>
        or(
          like(property.city, `%${word}%`),
          like(property.title, `%${word}%`),
          like(property.description, `%${word}%`),
          like(property.amenities, `%${word}%`),
          like(property.address, `%${word}%`)
        )
      );

      filters.push(or(...fieldMatches));
    }

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

propertyRoutes.get("/mine", async (c) => {
  try {
    const { id } = c.get("jwtPayload");
    const { page = "1", limit = "30", search } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    // const limitNumber = parseInt(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const fieldMatches = words.map((word) =>
        or(
          like(property.city, `%${word}%`),
          like(property.title, `%${word}%`),
          like(property.description, `%${word}%`),
          like(property.amenities, `%${word}%`),
          like(property.address, `%${word}%`)
        )
      );

      filters.push(or(...fieldMatches));
    }

    filters.push(eq(property.user_id, id));
    const whereClause = filters.length ? and(...filters) : undefined;

    const [properties, total] = await Promise.all([
      db.query.property.findMany({
        where: whereClause,
        limit: limitNumber,
        offset: offset,
        // orderBy: sql`RAND()`,
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
      message: "My Properties retrieved",
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

propertyRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("jwtPayload");

    await db
      .delete(property)
      .where(and(eq(property.id, id), eq(property.user_id, user.id)));

    return c.json({
      message: "Property deleted",
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

propertyRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const propertyInfo = await db.query.property.findFirst({
      where: eq(property.id, id),
      with: {
        images: true,
        user: {
          columns: {
            first_name: true,
            last_name: true,
            last_login: true,
            email: true,
            phone: true,
            verified: true,
            created_at: true,
          },
        },
        schedules: true,
      },
    });

    if (!propertyInfo) {
      return c.json(
        {
          message: "Property not found",
        },
        404
      );
    }

    return c.json({
      message: "Property retrieved",
      data: propertyInfo,
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default propertyRoutes;
