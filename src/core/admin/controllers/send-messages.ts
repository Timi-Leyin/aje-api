import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import sendEmail from "../../../helpers/send-email";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { to, message, subject } = req.body;
    await sendEmail({
      html: message,
      subject,
      to,
    });

    return res.status(200).json(
      responseObject({
        message: "Message sent successfully",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
