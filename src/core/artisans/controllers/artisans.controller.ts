import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import artisanServices from "../artisan.services";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { limit, offset, page } = getPaginaionParams(req);
    const data = await artisanServices.getArtisans({
      limit,
      offset,
      page,
    });

    return res.status(200).json(
      responseObject({
        message: "Artisan retrieved successfully",
        data,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
