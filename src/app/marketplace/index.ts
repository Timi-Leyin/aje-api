import { Hono } from "hono";
import { Variables } from "../..";
import { createProductValidator, editProductValidator } from "./validator";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { files, product } from "../../db/schema";
import { deleteFile, uploadFiles } from "../../helpers/files";
import { MAX_LIMIT_DATA } from "../../constants";
import { and, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { getActiveSubscription } from "../../helpers/subscription";

const marketplaceRoutes = new Hono<{ Variables: Variables }>();

marketplaceRoutes.post("/product", createProductValidator, async (c) => {
  try {
    const { id: user_id, user_type } = c.get("jwtPayload");
    const { images, price, lat, lon, ...rest } = c.req.valid("form");
    if (!images) {
      return c.json({ message: "Images is required" }, 400);
    }
    // Restrict buyers to only one product
    if (user_type === "buyer") {
      const existing = await db.query.product.findFirst({
        where: eq(product.user_id, user_id),
      });
      if (existing) {
        return c.json({ message: "Buyers can only post one product." }, 403);
      }
    }
    const id = nanoid();

    await db.insert(product).values({
      id,
      price: Number(price),
      lat: Number(lat) || null,
      lon: Number(lon) || null,
      user_id,
      ...rest,
    });

    await uploadFiles(images, {
      product_id: id,
    });

    return c.json({ message: "Product Created", id });
  } catch (error) {
    console.log(error);
    return c.json({ message: "Internal Server error" }, 500);
  }
});

marketplaceRoutes.get("/product", async (c) => {
  try {
    const {
      page = "1",
      limit = "30",
      city,
      type,
      minPrice,
      maxPrice,
      search,
    } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    if (type) filters.push(eq(product.type, type));
    if (minPrice) filters.push(gte(product.price, parseFloat(minPrice)));
    if (maxPrice) filters.push(lte(product.price, parseFloat(maxPrice)));
    if (city) {
      const words = city.trim().split(/\s+/).filter(Boolean);
      filters.push(like(product.city, `%${city}%`));
      const conditions = words.map((word) => like(product.city, `%${word}%`));
      filters.push(or(...conditions));
    }
    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const fieldMatches = words.map((word) =>
        or(
          like(product.city, `%${word}%`),
          like(product.title, `%${word}%`),
          like(product.description, `%${word}%`)
        )
      );
      filters.push(or(...fieldMatches));
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    // Fetch products with owner info
    const [products, total] = await Promise.all([
      db.query.product.findMany({
        where: whereClause,
        limit: limitNumber,
        offset: offset,
        orderBy: sql`RAND()`,
        with: {
          images: { limit: 2 },
          user: { columns: { id: true, user_type: true } },
        },
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(product)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    // Filter products based on owner type and subscription
    const filteredProducts = [];
    for (const prod of products) {
      if (!prod.user) continue;
      const ownerType = prod.user.user_type;
      if (ownerType === "buyer" || ownerType === "admin") {
        filteredProducts.push(prod);
        continue;
      }
      if (ownerType === "vendor") {
        const sub = await getActiveSubscription(prod.user.id);
        if (sub && sub.active && !sub.expired && sub.status === "success") {
          filteredProducts.push(prod);
        }
        continue;
      }
      // For other user types, skip
    }

    return c.json({
      message: "Products retrieved",
      data: filteredProducts,
      meta: {
        total: filteredProducts.length,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(filteredProducts.length / limitNumber),
      },
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export type ImageGroupType = {
  name: string;
  images: {
    uri: string;
    width: number;
    height: number;
  }[];
};

marketplaceRoutes.put("product/:id", editProductValidator, async (c) => {
  const { id: user_id } = c.get("jwtPayload");
  const paramId = c.req.param("id");
  const forms = c.req.valid("form");

  try {
    const {
      address,
      city,
      currency,
      description,
      images,
      lat,
      lon,
      otherImages,
      price,
      title,
      type,
    } = forms;
    const allImages = JSON.parse(otherImages || "[]") as ImageGroupType[];
    const flatten =
      allImages?.reduce((acc: any[], cur: any) => {
        return [...acc, ...cur.images];
      }, []) || [];

    const previouslyUploaded = await db.query.files.findMany({
      where: eq(files.product_id, paramId),
    });

    // console.log("Previous", previouslyUploaded);
    // console.log("FALTTED", flatten);

    const toBeDeleted = previouslyUploaded
      .map((prev) => {
        const isInFlat = flatten.some((a) => a.id === prev.id);
        if (!isInFlat) return prev;
      })
      .filter(Boolean);

    await Promise.all(
      toBeDeleted.map(async (de) => de && (await deleteFile(de.id)))
    );

    await db
      .update(product)
      .set({
        currency: currency as any,
        description,
        title: title,
        price: Number(price),
        lat: Number(lat),
        lon: Number(lon),
        city: city,
        type,
        address,
        user_id,
      })
      .where(and(eq(product.id, paramId), eq(product.user_id, user_id)));

    await uploadFiles(images, {
      product_id: paramId,
    });

    return c.json({ message: "Product updated" });
  } catch (error) {
    // console.log(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

marketplaceRoutes.get("/product/mine", async (c) => {
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
          like(product.city, `%${word}%`),
          like(product.title, `%${word}%`),
          like(product.description, `%${word}%`),
          like(product.address, `%${word}%`)
        )
      );

      filters.push(or(...fieldMatches));
    }

    filters.push(eq(product.user_id, id));
    const whereClause = filters.length ? and(...filters) : undefined;

    const [products, total] = await Promise.all([
      db.query.product.findMany({
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
        .from(product)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      message: "My Products retrieved",
      data: products,
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

marketplaceRoutes.get("/product/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const productInfo = await db.query.product.findFirst({
      where: eq(product.id, id),
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
          with: {
            profile_photo: true,
          },
        },
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

    if (!productInfo) {
      return c.json(
        {
          message: "Product not found",
        },
        404
      );
    }

    return c.json({
      message: "Product retrieved",
      data: productInfo,
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

marketplaceRoutes.delete("/product/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("jwtPayload");

    await db
      .delete(product)
      .where(and(eq(product.id, id), eq(product.user_id, user.id)));

    return c.json({
      message: "Product deleted",
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default marketplaceRoutes;
