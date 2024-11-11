import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import propertyService from "../property.service";
import responseObject from "../../../helpers/response-object";
import { PRODUCT_TYPE } from "@prisma/client";

type QueryParams = {
  query: string;
  type: PRODUCT_TYPE;
};

export default async (req: Request, res: Response) => {
  try {
    const { query, type } = req.query as QueryParams;
    const { limit, offset, page } = getPaginaionParams(req);
    const properties = await propertyService.getProperties({
      limit,
      offset,
      page,

      where: {
        title: query,
        type,
      },
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
