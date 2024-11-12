import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import propertyService from "../property.service";
import responseObject from "../../../helpers/response-object";
import { PRODUCT_TYPE } from "@prisma/client";

export type FILTERED = "tags" | "top-reviewed";
type QueryParams = {
  query: string;
  type: PRODUCT_TYPE;
  filterdBy?: FILTERED;
  filterValue?: string;
};

export default async (req: Request, res: Response) => {
  try {
    const { query, type, filterValue, filterdBy } = req.query as QueryParams;
    const { limit, offset, page } = getPaginaionParams(req);
    const properties = await propertyService.getProperties({
      limit,
      offset,
      page,

      where: {
        title: query,
        type,
      },

      filters: {
        by: filterdBy,
        value: filterValue,
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
