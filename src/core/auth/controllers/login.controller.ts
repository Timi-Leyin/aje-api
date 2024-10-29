import { Request, response, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";

export default async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
  } catch (error) {
    return errorHandler(res, error);
  }
};
