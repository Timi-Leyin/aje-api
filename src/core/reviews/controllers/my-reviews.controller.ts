import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";

export default (req: Request, res: Response) => {
  try {
    return res.status(200);
  } catch (error) {
    return errorHandler(res, error);
  }
};
