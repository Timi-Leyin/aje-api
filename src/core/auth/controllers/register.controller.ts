import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";

import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";
import { RegisterDTO } from "../auth.dto";
import { AccountAlreadyExist } from "../..";
import { hashPassword } from "../../../helpers/password";
import { AUTH_PROVIDER } from "@prisma/client";
import { userService } from "../../users/users.service";
export default async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body as RegisterDTO;
    // check if user with email exists
    const userExists = await userService.checkUserEmail(email, {});

    // user exists
    if (userExists) {
      return AccountAlreadyExist(res);
    }

    const hashed = await hashPassword(password);
    const user = await userService.createUser({
      email,
      firstName,
      lastName,
      authProvider: AUTH_PROVIDER.EMAIL,
      password: {
        create: {
          content: hashed,
        },
      },
    });

    //  generate access token
    const payload = {
      id: user.uuid,
    };
    const token = await generateToken(payload);
    return res.status(201).json(
      responseObject({
        message: "Registered successfully",
        accessToken: token,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
