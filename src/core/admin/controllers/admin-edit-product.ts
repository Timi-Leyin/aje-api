import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { bulkFileUploader } from "../../../helpers/file-uploader";
import marketplaceService from "../../marketplace/marketplace.service";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { body, files, params } = req;
    const { id } = params;
    const images = (req.files || []) as Express.Multer.File[];
    const uploadedImages = await bulkFileUploader(
      images.map((img) => ({ src: img.path, identifier: img.originalname }))
    );

    await marketplaceService.editMarketplace({
      id,
      description: body.description,
      address: body.address,
      currency: body.currency,
      tags: body.tags,
      images: uploadedImages,
      name: body.title,
      price: body.price,
      //   @ts-ignore
      userId: req?.user?.uuid,
      existingImages: body.existingImages,
    });
    return res.status(200).json(
      responseObject({
        message: "Updated",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
