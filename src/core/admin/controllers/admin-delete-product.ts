import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { db } from "../../../config/database";

export default async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.property.delete({
      where: {
        uuid: id,
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Deleted",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
