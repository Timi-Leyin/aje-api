import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import logger from "../../../helpers/logger";
import fileUploader, { bulkFileUploader } from "../../../helpers/file-uploader";
import propertyService from "../property.service";
import { createPropertyDTO } from "../property.dto";

export default async (req: Request, res: Response) => {
  try {
    const {
      description,
      title,
      tags,
      videoTour,
      price,
      listingType,
      type,
      yearBuilt,
      squareFeet,
      bedrooms,
      bathrooms,
      address,
      latitude,
      longitude,
    } = req.body as createPropertyDTO;
console.log(price)
console.log(req.body)
    // @ts-ignore
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
    const userType = req.user.type;
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

    const property = await propertyService.createProperties({
      // @ts-ignore
      userId: req.user.uuid,
      description,
      title,
      listingType,
      address,
      latitude,
      longitude,
      videoTour,
      price,
      type:
        userType == "AGENT"
          ? "PROPERTY"
          : userType == "VENDOR"
          ? "PRODUCT"
          : "SERVICES",
      images: uploadImages,
      tags,
      specifications: {
        yearBuilt: String(yearBuilt),
        bathrooms: Number(bathrooms),
        bedrooms: Number(bedrooms),
        squareFeet: String(squareFeet),
      },
    });

    return res.status(201).json(
      responseObject({
        message: "Property created",
        data: property,
      })
    );
  } catch (error) {
    console.log(error)
    return errorHandler(res, error);
  }
};
