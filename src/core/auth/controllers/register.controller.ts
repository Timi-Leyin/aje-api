import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";

import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";
import { RegisterDTO } from "../auth.dto";
import { AccountAlreadyExist } from "../..";
export default async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body as RegisterDTO;
    // check if user with email exists

    // user exists

    return AccountAlreadyExist(res);

    //  generate access token

    // const payload = {
    //   id: user.uuid,
    // };
    // const token = await generateToken(payload);
    // return res.status(201).json(
    //   responseObject({
    //     message: "Registered successfully",
    //     accessToken: token,
    //   })
    // );
  } catch (error) {
    return errorHandler(res, error);
  }
};
