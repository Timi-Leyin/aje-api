import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import propertyService from "../property.service";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { limit, offset, page } = getPaginaionParams(req);
    const properties = await propertyService.getProperties({
      limit,
      offset,
      page,
    });

    return res.status(200).json(
      responseObject({
        message: "Properties Retrieved",
        data: properties,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
