import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { db } from "../../../config/database";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await db.user.findUnique({
      where: {
        uuid: id,
      },
      include: {
        avatar: true,

        gallery: true,
        business: {
          include: {
            address: true,
          },
        },
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Retrived",
        data: user,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
