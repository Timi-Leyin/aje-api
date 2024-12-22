import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { db } from "../../../config/database";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const ads = await db.ad.findMany({
      include: {
        image: {
          select: {
            src: true,
            uuid: true,
            provider: true,
          },
        },
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Ads Retrived",
        data: ads,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
