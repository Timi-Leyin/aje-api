import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { verifyOtpDTP } from "../auth.dto";
import { userService } from "../../users/users.service";

export default async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;

    const valid = await userService.compareOtp(otp, email);

    if (!valid) {
      return res.status(400).json(
        responseObject({
          message: "Invalid/Expired OTP",
        })
      );
    }

    return res.status(200).json(
      responseObject({
        message: "OTP Verified",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
