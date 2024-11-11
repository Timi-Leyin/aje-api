import { Request, Response } from "express";
import errorHandler from "../../helpers/error-handler";

export default (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const { user } = req;
    
  } catch (error) {
    return errorHandler(res, error);
  }
};
