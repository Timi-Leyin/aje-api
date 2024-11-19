import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import logger from "../../../helpers/logger";
import fileUploader, { bulkFileUploader } from "../../../helpers/file-uploader";
import propertyService from "../property.service";
import { createPropertyDTO } from "../property.dto";
import { PROPERTY_STATUS } from "@prisma/client";

export default async (req: Request, res: Response) => {
  try {
    const {
      description,
      title,
      videoTour,
      price,
      listingType,
      yearBuilt,
      squareFeet,
      bedrooms,
      status,
      propertyId,
      bathrooms,
      address,
    } = req.body as createPropertyDTO;

    const check = await propertyService.getProperty({ uuid: propertyId });

    if (!check) {
      return res.status(404).json(
        responseObject({
          message: "Requested Item not Found",
        })
      );
    }
    
logger(status)
    // @ts-ignore
    if (check.userId !== req.user.uuid) {
      return res.status(400).json(
        responseObject({
          message: "Unauthorized Access",
        })
      );
    }

    const property = await propertyService.updateProperties({
      // @ts-ignore
      userId: req.user.uuid,
      description,
      title,
      listingType,
      address,
      propertyId,
      status: status.toUpperCase() as PROPERTY_STATUS,
      videoTour,
      price,
      specifications: {
        yearBuilt: String(yearBuilt),
        bathrooms: Number(bathrooms),
        bedrooms: Number(bedrooms),
        squareFeet: String(squareFeet),
      },
    });

    return res.status(201).json(
      responseObject({
        message: "Property updated",
        data: property,
      })
    );
  } catch (error) {
    // logger(error)
    return errorHandler(res, error);
  }
};
