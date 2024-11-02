import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import propertyService from "../property.service";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await propertyService.getProperty({ uuid: id });
    if (!property) {
      return res.status(404).json(
        responseObject({
          message: "Property not found",
        })
      );
    }

    return res.status(200).json(
      responseObject({
        message: "Property Retrieved",
        data: property,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
