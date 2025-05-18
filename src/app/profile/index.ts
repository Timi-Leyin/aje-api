import { Hono } from "hono";
import { db } from "../../db";
import { gallery, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { updateProfileValidator, uploadAvatarValidator } from "./validator";
import { deleteFile, uploadFiles } from "../../helpers/files";
import { Variables } from "../..";
import { nanoid } from "nanoid";

const profileRoutes = new Hono<{ Variables: Variables }>();

profileRoutes.get("/", async (c) => {
  const data = c.get("jwtPayload");
  return c.json({ message: "profile retrieved", data });
});

profileRoutes.put("/", updateProfileValidator, async (c) => {
  const { id } = c.get("jwtPayload");
  const { firstName, lastName, phone, available, bio, services, address } =
    c.req.valid("json");
  // if ((!firstName && !lastName && !phone && !bio && !services && !available) || available) {
  //   return c.json({ message: "No data to update" }, 200);
  // }
  // console.log(Boolean(available=="true"))
  await db
    .update(users)
    .set({
      first_name: firstName,
      last_name: lastName,
      phone,
      available: Boolean(available == "true"),
      bio,
      address,
      services,
    })
    .where(eq(users.id, id));
  return c.json({ message: "Profile updated successfully" });
});

profileRoutes.post("/upload-avatar", uploadAvatarValidator, async (c) => {
  const { id, profile_photo } = c.get("jwtPayload");
  const { image } = c.req.valid("form");
  if (!image) {
    return c.json({ message: "Invalid Image" }, 400);
  }

  profile_photo?.id &&
    (await deleteFile(profile_photo.id).catch(() => undefined));

  await uploadFiles(image, {
    user_id: id,
  });
  return c.json({ message: "Profile uploaded" });
});

profileRoutes.delete("/delete-avatar", async (c) => {
  const { profile_photo } = c.get("jwtPayload");

  if (!profile_photo || !profile_photo?.id) {
    return c.json({ message: "Image not found on the server" }, 400);
  }

  await deleteFile(profile_photo?.id);
  return c.json({ message: "Image Removed" });
});

// GALLERY

// GET Gallery For User needs
profileRoutes.get("/gallery", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");
    const galleries = await db.query.gallery.findFirst({
      where: eq(gallery.user_id, user_id),
      with: {
        images: true,
      },
    });

    return c.json({ message: "Gallery Info Retrieved", data: galleries });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});
profileRoutes.get("/gallery/:user_id", async (c) => {
  try {
    const user_id = c.req.param("user_id");
    const galleries = await db.query.gallery.findFirst({
      where: eq(gallery.user_id, user_id),
      with: {
        images: true,
      },
    });

    return c.json({ message: "Gallery Info Retrieved", data: galleries });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

profileRoutes.post("/gallery", async (c) => {
  try {
    const { id: user_id } = c.get("jwtPayload");

    const { images, otherImages } = await c.req.parseBody();

    const galleries = await db.query.gallery.findFirst({
      where: eq(gallery.user_id, user_id),
      with: {
        images: true,
      },
    });

    if (galleries) {
      const OT_IMAGES = JSON.parse(String(otherImages) || "[]");

      const flatten =
        OT_IMAGES?.reduce((acc: any[], cur: any) => {
          return [...acc, ...cur.images];
        }, []) || [];

      const previouslyUploaded = galleries?.images || [];

      const toBeDeleted = previouslyUploaded
        .map((prev) => {
          const isInFlat = flatten.some((a: any) => a.id === prev.id);
          if (!isInFlat) return prev;
        })
        .filter(Boolean);

      await Promise.all(
        toBeDeleted.map(async (f) => {
          f?.id && (await deleteFile(f.id));
        })
      );

      images &&
        (await uploadFiles(images as File, {
          gallery_id: galleries.id,
        }));

      return c.json({ message: "Gallery Info Retrieved", data: galleries });
    }

    const id = nanoid();
    await db.insert(gallery).values({
      id,
      user_id,
    });

    await uploadFiles(images as File, {
      gallery_id: id,
    });

    return c.json({ message: "Gallery Info Retrieved", data: id });
  } catch (error) {
    return c.json({ message: "Internal server error" }, 500);
  }
});

export default profileRoutes;
