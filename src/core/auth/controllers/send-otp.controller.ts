import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { ForgotPasswordDTO } from "../auth.dto";
import { userService } from "../../users/users.service";
import { AccountNotFound } from "../..";
import sendEmail from "../../../helpers/send-email";
import logger from "../../../helpers/logger";

export default async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    // generate and send otp;
    const createdOTP = await userService._generateOtp(email);

    // if (!createdOTP) {
    //   return res
    //     .status(400)
    //     .json(responseObject({ message: "OTP already sent, Try again later" }));
    // }

    await sendEmail({
      html: `Your Verification Code is: ${createdOTP}`,
      subject: "Illumia Properties and Household Verification Code",
      to: email,
    }).catch(logger);

    return res
      .status(200)
      .json(responseObject({ message: "Otp sent to email" }));
  } catch (error) {
    return errorHandler(res, error);
  }
};
