import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import fileUploader from "../../../helpers/file-uploader";
import { db } from "../../../config/database";

export default async (req: Request, res: Response) => {
  try {
    const { title, description, link } = req.body;
    // @ts-ignore
    const image = req?.file;
    // if (!title || !description) {
    //   return res
    //     .status(400)
    //     .json(
    //       responseObject({ message: "Title and description are required" })
    //     );
    // }

    if (!image) {
      return res
        .status(400)
        .json(responseObject({ message: "Image is required" }));
    }

    const adImage = await fileUploader({ src: image.path });

    const ad = await db.ad.create({
      data: {
        title,
        description,
        link,
        image: {
          connect: {
            uuid: adImage?.uuid,
          },
        },
      },
    });

    return res
      .status(201)
      .json(responseObject({ message: "Ad created successfully", data: ad }));
  } catch (error) {
    return errorHandler(res, error);
  }
};
