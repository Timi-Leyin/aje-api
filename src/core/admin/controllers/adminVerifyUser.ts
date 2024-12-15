import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { db } from "../../../config/database";

export default async (req: Request, res: Response) => {
  try {
    const { verified, userId } = req.body;
    const isVerified = (verified || "").toLowerCase() == "true";

    await db.user.update({
      where: {
        uuid: userId,
      },
      data: {
        verified: isVerified,
      },
    });

    return res.status(200).json(
      responseObject({
        message: "Verification Status Updated to "+isVerified,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
