import { Hono } from "hono";
import { db } from "../../db";
import {
  docsVerification,
  gallery,
  notification,
  users,
  userCurrentLocation,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { updateProfileValidator, uploadAvatarValidator } from "./validator";
import { deleteFile, uploadFiles } from "../../helpers/files";
import { Variables } from "../..";
import { nanoid } from "nanoid";
import { sendNotification } from "../../helpers/notification";

const profileRoutes = new Hono<{ Variables: Variables }>();

profileRoutes.get("/", async (c) => {
  const data = c.get("jwtPayload");
  return c.json({ message: "profile retrieved", data });
});

profileRoutes.post("/upload-identification", async (c) => {
  const { id, verified } = c.get("jwtPayload");
  const form = await c.req.parseBody();

  if (verified) {
    return c.json({ message: "You have already verified your account" }, 400);
  }

  const ninDoc = form.ninDoc as File;
  const cacDoc = form.cacDoc as File | undefined;

  if (!ninDoc) {
    return c.json({ message: "NIN/ID documents is required" }, 400);
  }

  await db.delete(docsVerification).where(eq(docsVerification.user_id, id));
  const docID = nanoid();

  await db.insert(docsVerification).values({
    id: docID,
    user_id: id,
  });

  // Upload required documents
  await uploadFiles(ninDoc, {
    nin_doc_id: docID,
  });

  // Upload optional CAC document if provided
  if (cacDoc) {
    await uploadFiles(cacDoc, {
      cac_doc_id: docID,
    });
  }

  await db
    .update(users)
    .set({ verification_status: "pending" })
    .where(eq(users.id, id));

  await sendNotification(id, {
    title: "Verification pending",
    type: "security",
    message: "Your verification request is now pending review.",
  }).catch((error) => console.log("Failed to send notification"));

  return c.json({ message: "Identification documents uploaded successfully" });
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

profileRoutes.post("/fcm-token", async (c) => {
  const { id } = c.get("jwtPayload");
  const { fcm_token, loc } = await c.req.json();
  if (!fcm_token) {
    return c.json({ message: "FCM token is required" }, 400);
  }
  
  // Update FCM token
  await db.update(users).set({ fcm_token }).where(eq(users.id, id));
  
  if (loc) {
    const { lat, lon, address } = loc;
    
    // Check if user already has a location record
    const existingLocation = await db.query.userCurrentLocation.findFirst({
      where: eq(userCurrentLocation.user_id, id),
    });
    
    if (existingLocation) {
      await db
        .update(userCurrentLocation)
        .set({
          lat: lat || null,
          lon: lon || null,
          address: address || null,
          manually_added: false, // This is auto-updated from FCM token
        })
        .where(eq(userCurrentLocation.user_id, id));
    } else {
      await db.insert(userCurrentLocation).values({
        id: nanoid(),
        user_id: id,
        lat: lat || null,
        lon: lon || null,
        address: address || null,
        manually_added: false, // This is auto-updated from FCM token
      });
    }
  }
  
  return c.json({ message: "FCM token saved successfully" });
});

profileRoutes.get("/notifications", async (c) => {
  const { id: user_id } = c.get("jwtPayload");
  const { page = "1", limit = "50" } = c.req.query();
  const pageNumber = parseInt(page);
  const limitNumber = Math.max(1, Math.min(parseInt(limit) || 50, 100));
  const offset = (pageNumber - 1) * limitNumber;

  const [notifications, total] = await Promise.all([
    db.query.notification.findMany({
      where: eq(notification.user_id, user_id),
      limit: limitNumber,
      offset,
    }),
    db.query.notification
      .findMany({
        where: eq(notification.user_id, user_id),
      })
      .then((n) => n.length),
  ]);

  return c.json({
    message: "Notifications retrieved",
    data: notifications,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  });
});

profileRoutes.post("/change-user-type", async (c) => {
  const { id, user_type: currentType } = c.get("jwtPayload");
  const { user_type } = await c.req.json();
  const allowedTypes = ["agent", "vendor", "artisan"];
  if (!user_type || !allowedTypes.includes(user_type)) {
    return c.json({ message: "Invalid or forbidden user_type" }, 400);
  }
  if (currentType === "admin") {
    return c.json({ message: "Admin user_type cannot be changed" }, 403);
  }
  await db.update(users).set({ user_type }).where(eq(users.id, id));
  return c.json({ message: `User type changed to ${user_type}` });
});

profileRoutes.get("/location", async (c) => {
  const { id } = c.get("jwtPayload");
  
  const location = await db.query.userCurrentLocation.findFirst({
    where: eq(userCurrentLocation.user_id, id),
  });
  
  return c.json({ 
    message: "Location retrieved", 
    data: location 
  });
});

profileRoutes.post("/update-location", async (c) => {
  const { id } = c.get("jwtPayload");
  const { lat, lon, address } = await c.req.json();
  
  if (!lat || !lon) {
    return c.json({ message: "Latitude and longitude are required" }, 400);
  }
  
  // Check if user already has a location record
  const existingLocation = await db.query.userCurrentLocation.findFirst({
    where: eq(userCurrentLocation.user_id, id),
  });
  
  if (existingLocation) {
    // Update existing location
    await db
      .update(userCurrentLocation)
      .set({
        lat,
        lon,
        address: address || null,
        manually_added: true, // This is manually updated
      })
      .where(eq(userCurrentLocation.user_id, id));
  } else {
    // Create new location record
    await db.insert(userCurrentLocation).values({
      id: nanoid(),
      user_id: id,
      lat,
      lon,
      address: address || null,
      manually_added: true, // This is manually updated
    });
  }
  
  return c.json({ message: "Location updated successfully" });
});

export default profileRoutes;
