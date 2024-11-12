import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import reviewServices from "../reviews.services";
import responseObject from "../../../helpers/response-object";

export default (req: Request, res: Response) => {
  try {
    const { rating, title, content, productId } = req.body;
    // @ts-ignore
    const userEmail = req.user.email;

    const newReview = reviewServices.addReview({
      content,
      productId,
      rating,
      title,
      userEmail,
    });
    res.status(201).json(
      responseObject({
        message: "Review Added",
        data: newReview,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
