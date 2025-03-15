import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { bulkFileUploader } from "../../../helpers/file-uploader";
import { createMarketplace } from "../marketplace.dto";
import marketplaceService from "../marketplace.service";

export default async (req: Request, res: Response) => {
  try {
    const { description, name, price, address, phoneNumber, moreInfo } =
      req.body as createMarketplace;

    // @ts-ignoreaddress
    if (
      !req.files ||
      // @ts-ignore
      !req.files["images"] ||
      // @ts-ignore
      req.files["images"].length === 0
    ) {
      return res.status(400).json(
        responseObject({
          message: "Fill in the Required Fields",
          errors: [
            {
              field: "images",
              message: "Required",
            },
          ],
        })
      );
    }

    // @ts-ignore
    const images = req.files && (req.files.images || []);

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

    const marketplace = await marketplaceService.createMarketplace({
      // @ts-ignore
      userId: req.user.uuid,
      description,
      name,
      price,
      address,
      phone: phoneNumber,
      images: uploadImages,
      moreInfo,
    });

    return res.status(201).json(
      responseObject({
        message: "Marketplace Created",
        data: marketplace,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
