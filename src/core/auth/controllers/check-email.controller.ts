import { Request, Response } from "express";
import { userService } from "../../users/users.service";
import responseObject from "../../../helpers/response-object";
import errorHandler from "../../../helpers/error-handler";

export default async (req: Request, res: Response) => {
  const email = String(req.query?.email || "");

  try {
    const checkEmail = await userService.checkUserEmail(email, {});
    if (checkEmail) {
      return res.status(400).json(
        responseObject({
          message: "Email already exists",
        })
      );
    }
    return res.status(200).json(
      responseObject({
        message: "Email does not exist",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
