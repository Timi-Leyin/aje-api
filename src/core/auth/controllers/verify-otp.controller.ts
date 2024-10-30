import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { verifyOtpDTP } from "../auth.dto";
import { userService } from "../../users/users.service";

export default async (req: Request, res: Response) => {
  try {
    const { otp, email, newPassword } = req.body as verifyOtpDTP;

    const valid = await userService.compareOtp(otp, email);

    if (!valid) {
      return res.status(400).json(
        responseObject({
          message: "Invalid/Expired OTP",
        })
      );
    }

    // update password
    await userService.updatePassword(email, newPassword);
    return res.status(200).json(
      responseObject({
        message: "Password Updated Successfully",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
