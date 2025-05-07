import { Hono } from "hono";
import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { updateProfileValidator, uploadAvatarValidator } from "./validator";
import { deleteFile, uploadFiles } from "../../helpers/files";
import { Variables } from "hono/types";

const profileRoutes = new Hono<{ Variables: Variables }>();

profileRoutes.get("/", async (c) => {
  const data = c.get("jwtPayload");
  return c.json({ message: "profile retrieved", data });
});

profileRoutes.put("/", updateProfileValidator, async (c) => {
  const { id } = c.get("jwtPayload");
  const { firstName, lastName, phone } = c.req.valid("json");
  if (!firstName && !lastName && !phone) {
    return c.json({ message: "No data to update" }, 200);
  }
  await db
    .update(users)
    .set({
      first_name: firstName,
      last_name: lastName,
      phone,
    })
    .where(eq(users.id, id));
  return c.json({ message: "Profile updated successfully" });
});

profileRoutes.post("/upload-avatar", uploadAvatarValidator, async (c) => {
  const { id } = c.get("jwtPayload");
  const { image } = c.req.valid("form");
  if (!image) {
    return c.json({ message: "Invalid Image" }, 400);
  }

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

export default profileRoutes;
