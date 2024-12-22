import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { db } from "../../../config/database";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.ad.delete({
      where: {
        uuid: id,
      },
    });
    
    return res.status(200).json(
      responseObject({
        message: "Ads Deleted",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
