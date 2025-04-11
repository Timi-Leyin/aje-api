import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { bulkFileUploader } from "../../../helpers/file-uploader";
import marketplaceService from "../../marketplace/marketplace.service";
import { GUser } from "../../../helpers/token";

export default async (req: Request, res: Response) => {
  try {
    const { body, files } = req;
    const images = (req.files || []) as Express.Multer.File[];

    if (!images) {
      return res.status(400).json(
        responseObject({
          message: "Fill in the Required Fields",
        })
      );
    }

    const uploadImages = await bulkFileUploader(
      images.map((img) => ({ src: img.path, identifier: img.originalname }))
    );

    if (!uploadImages) {
      return res.status(400).json(
        responseObject({
          message: "Could not upload image",
        })
      );
    }

    await marketplaceService.createMarketplace({
      address: body.address,
      description: body.description,
      name: body.title,
      moreInfo: body.tags.join(","),
      images: uploadImages,
      //   @ts-ignore
      phone: req?.user?.phone || req?.user?.business?.phone,
      price: body.price,
      currency: body.currency,
      tags:body.tags,
      // @ts-ignore
      userId: req.user.uuid,
    });

    return res.status(200).json(
      responseObject({
        message: "Product Created",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
