import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { AccountNotFound, useProviderForAuth } from "../..";
import { comaparePassword } from "../../../helpers/password";
import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";
import { LoginDTO } from "../../auth/auth.dto";
import { userService } from "../../users/users.service";

export const adminLoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginDTO;
    // check user
    const user = await userService.checkUserEmail(email, { password: true });

    if (!user) {
      return AccountNotFound(res);
    }

    if (user.type !== "ADMIN") {
      return AccountNotFound(res);
    }

    // if not password
    if (!user.password?.content) {
      return useProviderForAuth(res, user.authProvider);
    }

    // match password
    const passwordMatch = comaparePassword(password, user.password?.content);

    if (!passwordMatch) {
      return AccountNotFound(res);
    }

    //  generate access token
    const payload = {
      id: user.uuid,
    };
    const token = await generateToken(payload);
    return res.status(201).json(
      responseObject({
        message: "Login successfully",
        accessToken: token,
        data: user,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
