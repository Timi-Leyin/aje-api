import { Hono } from "hono";
import { jwt, JwtVariables } from "hono/jwt";
import { JwtPayload } from "../../helpers/secrets";
import { db } from "../../db";
import { files, users } from "../../db/schema";
import { eq, InferModel } from "drizzle-orm";
import { updateProfileValidator, uploadAvatarValidator } from "./validator";
import { deleteFile, uploadFiles } from "../../helpers/files";

type Variables = JwtVariables<InferModel<typeof users>>;
const profileRoutes = new Hono<{ Variables: Variables }>();

// PROTECTED
profileRoutes.use(
  "/*",
  jwt({
    secret: process.env.JWT_SECRET,
  }),
  async (c, next) => {
    const { id } = c.get("jwtPayload");
    const profile = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        profile_photo: true,
      },
    });

    if (!profile) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    const { password, ...rest } = profile as any;
    c.set("jwtPayload", rest);
    await next();
  }
);

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
  const { id } = c.get("jwtPayload");
  const fileId = await db.query.files.findFirst({
    where: eq(files.user_id, id),
  });
  if (!fileId) return c.json({ message: "Image not found on the server" }, 400);
  await deleteFile(fileId?.id);
  return c.json({ message: "Image Removed" });
});

export default profileRoutes;
