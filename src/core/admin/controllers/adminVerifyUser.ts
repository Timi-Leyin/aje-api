import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { db } from "../../../config/database";
import sendEmail from "../../../helpers/send-email";

export default async (req: Request, res: Response) => {
  try {
    const { verified, userId } = req.body;
    const isVerified = Boolean(verified) == true;

    const user = await db.user.update({
      where: {
        uuid: userId,
      },
      data: {
        verified: isVerified,
      },
    });

    if (user && isVerified) {
      await sendEmail({
        html: `
              Hello ${user.email},
          
              Congratulations! Your account has been successfully verified. You can now access all the features of our platform.
          
              If you have any questions or need assistance, feel free to contact our support team.
          
              Best regards,
            `,
        subject: "Your Account Has Been Verified",
        to: user.email,
      });
    }

    return res.status(200).json(
      responseObject({
        message: "Verification Status Updated to " + isVerified,
      })
    );
  } catch (error) {
    console.log(error)
    return errorHandler(res, error);
  }
};
