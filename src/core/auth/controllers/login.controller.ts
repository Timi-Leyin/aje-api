import { Request, response, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";
import { LoginDTO } from "../auth.dto";
import { AccountNotFound, useProviderForAuth } from "../..";
import { comaparePassword } from "../../../helpers/password";
import { userService } from "../../users/users.service";
import logger from "../../../helpers/logger";

export default async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginDTO;
    // check user
    const user = await userService.checkUserEmail(email, { password: true });

    if (!user) {
      return AccountNotFound(res);
    }

    // if not password
    if (!user.password?.content) {
      return useProviderForAuth(res, user.authProvider);
    }

    // match password
    const passwordMatch = await comaparePassword(password, user.password?.content);

    if (!passwordMatch) {
      return AccountNotFound(res);
    }

    //  generate access token
    const payload = {
      id: user.uuid,
    };
    const token = await generateToken(payload);
    return res.status(200).json(
      responseObject({
        message: "Login successfully",
        accessToken: token,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
