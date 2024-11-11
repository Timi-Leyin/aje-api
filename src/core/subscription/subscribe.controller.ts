import { Request, Response } from "express";
import errorHandler from "../../helpers/error-handler";

export default (req: Request, res: Response) => {
  try {
    const {} = req.body
  } catch (error) {
    return errorHandler(res, error);
  }
};
