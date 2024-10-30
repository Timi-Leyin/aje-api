import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { Profile } from "passport";

export default (req: Request, res: Response) => {
  try {
    return res.send("An Error Occurred, Please try again");
  } catch (error) {
    return errorHandler(res, error);
  }
};
