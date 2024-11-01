import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";

export default (req: Request, res: Response) => {
  try {
    console.log("My Profile")
    return res.status(200).json(
      responseObject({
        message: "Profile Retrieved",
        data: req.user,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
