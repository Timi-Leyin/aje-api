import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { Profile } from "passport";
import { userService } from "../../users/users.service";
import { AUTH_PROVIDER, PROVIDER, user } from "@prisma/client";
import { user as PrismaUser } from "@prisma/client";
import { generateToken } from "../../../helpers/token";
import { ENV } from "../../../constants/env";
import { sendEmailToAdmin } from "../../../helpers/send-email";
import { FRONTEND_FAILURE_REDIRECT } from "../../../constants";

const FAILED_URL = `${ENV.BACKEND_URL}${FRONTEND_FAILURE_REDIRECT}`;
export default async (req: Request, res: Response) => {
  try {
    // TODO [] add error message to query params of redirect
    const user = req?.user as any as Profile;
    const TRY_AGAIN = `${ENV.BACKEND_URL}/api/auth/google?mode=retry`;
    // console.log(user)
    if (!user) {
      return res.redirect(TRY_AGAIN);
    }

    const email = user?.emails?.[0]?.value;

    if (!email) {
      return res.redirect(TRY_AGAIN);
    }

    const checkUser = await userService.checkUserEmail(email as string, {});
    // const photo =
    //   user.photos && user.photos.length > 0 ? user.photos[0].value : null;

    // let userDB: PrismaUser;

    // if (!checkUser) {
    //   userDB = await userService.createUser({
    //     email: email as string,
    //     authProvider: AUTH_PROVIDER.GOOGLE,
    //     firstName: user.name && user.name?.givenName,
    //     lastName: user.name && user.name?.familyName,
    //     avatar: photo
    //       ? {
    //           create: {
    //             src: photo,
    //             provider: PROVIDER.GOOGLE,
    //           },
    //         }
    //       : undefined,
    //   });

    //   await sendEmailToAdmin({
    //     subject: `A new user has been registered as ${userDB.type}`,
    //     html: `
    //           Hello Admin,

    //           A new user has registered on your platform with the following details:
    //           Email: ${userDB.email}
    //           Type: ${userDB.type}
    //           Provider: Google
    //           Registration Date: ${new Date().toLocaleString()}

    //           Please review the registration in the admin panel to verify user.

    //           This is an automated notification. Do not reply to this email.
    //         `,
    //   });
    // }

    // userDB = checkUser as PrismaUser;

    // if (!userDB) {
    //   return res.redirect(FAILED_URL);
    // }

    if (!checkUser) {
      return res.send("You don't have an account, Please Create an Account First");
    }

    // generate token
    const token = await generateToken({
      id: checkUser?.uuid,
    });

    const url = `${ENV.FRONTEND_URL}/auth/login?code=${token}`;
    return res.redirect(url);
  } catch (error) {
    return errorHandler(res, error);
  }
};
