import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import { db } from "../db";
import { files, files as filesTable } from "../db/schema";
import { UploadApiResponse } from "cloudinary";
import { eq } from "drizzle-orm";
import { CLOUD_UPLOAD_ASSETS } from "../constants";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { nanoid } from "nanoid";
interface Rl {
  property_id?: string;
  product_id?: string;
  user_id?: string;
  gallery_id?: string;
}
export const uploadFiles = async (file: File | File[], relations?: Rl) => {
  const files = Array.isArray(file) ? file : [file];
  const uploaded: string[] = [];

  if (CLOUD_UPLOAD_ASSETS) {
    for (const file of files) {
      console.log("> uploading", file.name);
      const buffer = await file.arrayBuffer();
      const stream = Readable.from(Buffer.from(buffer));

      const result = (await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          }
        );
        stream.pipe(uploadStream);
      })) as UploadApiResponse;

      await db.insert(filesTable).values({
        id: result.public_id,
        src: result.secure_url,
        name: file.name,
        provider: "cloudinary",
        ...relations,
      });

      uploaded.push(result.public_id);
    }
    return uploaded;
  }

  // # SELF HOSTED
  const PATH = path.join(process.cwd(), "temp");
  await fs.mkdir(PATH, { recursive: true });

  for (const file of files) {
    console.log("> uploading", file.name);
    const buffer = await file.arrayBuffer();
    const stream = Readable.from(Buffer.from(buffer));
    const publicId = nanoid();
    const type = file.type.split("/")[1];
    const filePath = path.join(PATH, `${publicId}.${type}`);
    await fs.writeFile(filePath, stream);

    await db.insert(filesTable).values({
      id: publicId,
      src: `/${publicId}.${type}`,
      name: file.name,
      provider: "self_hosted",
      ...relations,
    });

    uploaded.push(publicId);
  }

  return uploaded;
};

export const deleteFile = async (id: string) => {
  console.log("> deleting", id);
  await db.delete(files).where(eq(files.id, id));
  await cloudinary.uploader.destroy(id, {
    invalidate: true,
  });
};
