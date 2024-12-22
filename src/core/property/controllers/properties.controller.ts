import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import propertyService from "../property.service";
import responseObject from "../../../helpers/response-object";
import { PRODUCT_TYPE } from "@prisma/client";
import logger from "../../../helpers/logger";

export type FILTERED = "tags" | "top-reviewed";
type QueryParams = {
  query: string;
  type: PRODUCT_TYPE;
  filterdBy?: FILTERED;
  filterValue?: string;
  tag?: string;
  marketplace?: string;
  listingType?: "Rent" | "Sale" | "Shotlet" | "Hotel";
  bathroom?: string | number;
  bedroom?: string | number;
};

export default async (req: Request, res: Response) => {
  try {
    const {
      query,
      marketplace,
      type,
      filterValue,
      filterdBy,
      bathroom,
      bedroom,
      tag,
      listingType,
    } = req.query as unknown as QueryParams;
    const { limit, offset, page } = getPaginaionParams(req);
    const properties = await propertyService.getProperties({
      limit,
      offset,
      page,

      where: {
        title: query||"",
        type,
        marketplace,
        bathroom,
        bedroom,
        tag,
      },

      filters: {
        listingType,
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
