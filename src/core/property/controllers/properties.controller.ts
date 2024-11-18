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
  tag?: string;
  bathroom?: string | number;
  bedroom?: string | number;
};

export default async (req: Request, res: Response) => {
  try {
    const { query, type, filterValue, filterdBy, bathroom, bedroom, tag } =
      req.query as QueryParams;
    const { limit, offset, page } = getPaginaionParams(req);
    const properties = await propertyService.getProperties({
      limit,
      offset,
      page,

      where: {
        title: query,
        type,
        bathroom,
        bedroom,
        tag,
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
