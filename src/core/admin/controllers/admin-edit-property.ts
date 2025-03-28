import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";

import { PROPERTY_STATUS } from "@prisma/client";
import { createPropertyDTO } from "../../property/property.dto";
import propertyService from "../../property/property.service";

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
