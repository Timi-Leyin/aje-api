import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import logger from "../../../helpers/logger";
import { isArray } from "util";
import { bulkFileUploader } from "../../../helpers/file-uploader";
import responseObject from "../../../helpers/response-object";
import { file } from "@prisma/client";
import { db } from "../../../config/database";
export default async (req: Request, res: Response) => {
  try {
    // Upload files available
    let uploadGallery: file[];
    // @ts-ignore
    if (Array.isArray(req.files) && req.files.length) {
      const uploader = req.files.map((file) => {
        return {
          src: file.path,
        };
      });
      uploadGallery = await bulkFileUploader(uploader);

      for (let i = 0; i < uploadGallery.length; i++) {
        const gallery = uploadGallery[i];

        // Fetch current gallery count
        const user = await db.user.findUnique({
          // @ts-ignore
          where: { uuid: req.user.uuid, type: "ARTISAN" },
          select: { gallery: true },
        });

        if (!user) {
          throw new Error("User not found.");
        }

        const currentGallery = user.gallery;

        // Ensure no more than 4 items in the gallery
        if (currentGallery.length >= 4) {
          if (i === 0) {
            // Replace the oldest or handle based on logic
            await db.user.update({
              // @ts-ignore
              where: { uuid: req.user.uuid },
              data: {
                gallery: {
                  set: [], // Clear the gallery (optional, replace logic here)
                },
              },
            });
          } else {
            break; // Stop adding more if 4 is already reached
          }
        }

        // Add new image to the gallery
        await db.user.update({
          // @ts-ignore
          where: { uuid: req.user.uuid },
          data: {
            gallery: {
              connect: { uuid: gallery.uuid },
            },
          },
        });
      }
      return res
        .status(200)
        .json(responseObject({ message: "Files Uploaded" }));
    }

    return res
      .status(400)
      .json(responseObject({ message: "Files are Required" }));
  } catch (error) {
    logger(error);
    return errorHandler(res, error);
  }
};
