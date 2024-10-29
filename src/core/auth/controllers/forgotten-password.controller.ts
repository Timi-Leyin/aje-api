import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
  } catch (error) {
    return errorHandler(res, error);
  }
};
