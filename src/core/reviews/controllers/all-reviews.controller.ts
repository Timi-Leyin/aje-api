import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import reviewServices from "../reviews.services";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit, offset, page } = getPaginaionParams(req);

    const data = await reviewServices.getReviews({
      propertyId: productId as string,
      limit,
      offset,
      page,
    });

    return res.status(200).json(
      responseObject({
        message: "Reviews Retrived Successfully",
        data,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
