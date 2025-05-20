import { Hono } from "hono";
import { db } from "../../../db";
import { advertisement, files } from "../../../db/schema";
import { eq, desc, sql, or, and } from "drizzle-orm";
import { MAX_LIMIT_DATA } from "../../../constants";
import { nanoid } from "nanoid";
import { deleteFile, uploadFiles } from "../../../helpers/files";

const adsRoutes = new Hono();

adsRoutes.get("/", async (c) => {
  try {
    const { page = "1", limit = "30", title } = c.req.query();

    const pageNumber = parseInt(page);
    const limitNumber = Math.min(parseInt(limit) || 30, MAX_LIMIT_DATA);
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];

    if (title) {
      filters.push(sql`${advertisement.title} LIKE ${`%${title}%`}`);
    }

    const whereClause = filters.length ? or(...filters) : undefined;

    const [allAds, total] = await Promise.all([
      db.query.advertisement.findMany({
        where: whereClause,
        with: {
          images: true,
        },
        limit: limitNumber,
        offset: offset,
        orderBy: desc(advertisement.created_at),
      }),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(advertisement)
        .where(whereClause)
        .then((res) => res[0].count),
    ]);

    return c.json({
      data: allAds,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching advertisements", error: error.message },
      500
    );
  }
});

adsRoutes.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const ad = await db.query.advertisement.findFirst({
      where: eq(advertisement.id, id),
      with: {
        images: true,
      },
    });

    if (!ad) {
      return c.json({ message: "Advertisement not found" }, 404);
    }

    return c.json({
      data: ad,
      message: "Advertisement fetched successfully",
    });
  } catch (error: any) {
    return c.json(
      { message: "Error fetching advertisement", error: error.message },
      500
    );
  }
});

adsRoutes.post("/", async (c) => {
  try {
    const { title, description, cta, cta_link, images } =
      await c.req.parseBody();

    // Validate required fields
    if (!title || !description) {
      return c.json({ message: "Title and description are required" }, 400);
    }

    const adId = nanoid();

    // Insert the advertisement
    await db.insert(advertisement).values({
      id: adId,
      title: String(title),
      description: String(description),
      cta: String(cta),
      cta_link: String(cta_link),
    });

    // Process images if provided
    if (images) {
      await uploadFiles(images as File, {
        advertisement_id: adId,
      });
    }
    ``;

    return c.json({
      message: "Advertisement created successfully",
    });
  } catch (error: any) {
    return c.json({ message: "Error creating advertisement" }, 500);
  }
});

adsRoutes.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { title, description, cta, cta_link } = await c.req.json();

    // Check if advertisement exists
    const adExists = await db.query.advertisement.findFirst({
      where: eq(advertisement.id, id),
    });

    if (!adExists) {
      return c.json({ message: "Advertisement not found" }, 404);
    }

    // Update advertisement
    await db
      .update(advertisement)
      .set({
        title: title !== undefined ? title : adExists.title,
        description:
          description !== undefined ? description : adExists.description,
        cta: cta !== undefined ? cta : adExists.cta,
        cta_link: cta_link !== undefined ? cta_link : adExists.cta_link,
        updated_at: new Date(),
      })
      .where(eq(advertisement.id, id));

    const updatedAd = await db.query.advertisement.findFirst({
      where: eq(advertisement.id, id),
      with: {
        images: true,
      },
    });

    return c.json({
      message: "Advertisement updated successfully",
      data: updatedAd,
    });
  } catch (error: any) {
    return c.json(
      { message: "Error updating advertisement", error: error.message },
      500
    );
  }
});

adsRoutes.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Delete related images first
    await db.delete(files).where(eq(files.advertisement_id as any, id));

    // Delete the advertisement
    await db.delete(advertisement).where(eq(advertisement.id, id));

    return c.json({
      message: "Advertisement and associated images deleted successfully",
    });
  } catch (error: any) {
    return c.json(
      { message: "Error deleting advertisement", error: error.message },
      500
    );
  }
});

adsRoutes.post("/:id/images", async (c) => {
  try {
    const id = c.req.param("id");
    const { images } = await c.req.parseBody();

    // Check if advertisement exists
    const adExists = await db.query.advertisement.findFirst({
      where: eq(advertisement.id, id),
    });

    if (!adExists) {
      return c.json({ message: "Advertisement not found" }, 404);
    }

    // Validate images
    if (!images || !Array.isArray(images) || images.length === 0) {
      return c.json({ message: "Images are required" }, 400);
    }

    await uploadFiles(images as File, {
      advertisement_id: id,
    });

    return c.json({
      message: "Images added to advertisement successfully",
    });
  } catch (error: any) {
    return c.json(
      { message: "Error adding images to advertisement", error: error.message },
      500
    );
  }
});

adsRoutes.delete("/:id/images/:imageId", async (c) => {
  try {
    const { id, imageId } = c.req.param();

    // Check if advertisement exists
    const adExists = await db.query.advertisement.findFirst({
      where: eq(advertisement.id, id),
    });

    if (!adExists) {
      return c.json({ message: "Advertisement not found" }, 404);
    }

    // Delete the image
    await deleteFile(imageId);
    // await db
    //   .delete(files)
    //   .where(and(eq(files.id, imageId), eq(files.advertisement_id as any, id)));

    return c.json({
      message: "Image deleted from advertisement successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        message: "Error deleting image from advertisement",
        error: error.message,
      },
      500
    );
  }
});

export { adsRoutes };
