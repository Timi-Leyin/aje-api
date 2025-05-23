import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";

import responseObject from "../../../helpers/response-object";
import { generateToken } from "../../../helpers/token";
import { RegisterDTO } from "../auth.dto";
import { AccountAlreadyExist } from "../..";
import { hashPassword } from "../../../helpers/password";
import { AUTH_PROVIDER, USER_TYPE } from "@prisma/client";
import { userService } from "../../users/users.service";
import logger from "../../../helpers/logger";
import fileUploader from "../../../helpers/file-uploader";
import { sendEmailToAdmin } from "../../../helpers/send-email";
export default async (req: Request, res: Response) => {
  try {
    // TOO [] CHOOSE USER TYPE
    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      businessAddress,
      businessName,
      phone,
    } = req.body as RegisterDTO;
    // check if user with email exists
    const userExists = await userService.checkUserEmail(email, {});

    // user exists
    if (userExists) {
      return AccountAlreadyExist(res);
    }

    const hashed = await hashPassword(password);
    const USER =
      userType == "Agent/Property Owner"
        ? USER_TYPE.AGENT
        : userType == "Artisan"
        ? USER_TYPE.ARTISAN
        : userType == "Vendor"
        ? USER_TYPE.VENDOR
        : USER_TYPE.BUYER;

    let uploadProfile;
    let uploadGovtId;
    let uploadCacDoc;
    // Upload files if available
    // @ts-ignore
    if (req.files?.["profilePhoto"]) {
      uploadProfile = await fileUploader({
        // @ts-ignore
        src: req.files["profilePhoto"][0].path,
      });
    }

    // @ts-ignore
    if (req.files?.["govtId"]) {
      uploadGovtId = await fileUploader({
        // @ts-ignore
        src: req.files["govtId"][0].path,
      });
    }

    // @ts-ignore
    if (req.files?.["cacDoc"]) {
      uploadCacDoc = await fileUploader({
        // @ts-ignore
        src: req.files["cacDoc"][0].path,
      });
    }

    const businessOwned = USER != "BUYER";

    const user = await userService.createUser({
      email,
      firstName,
      lastName,
      avatar: uploadProfile
        ? {
            connect: {
              uuid: uploadProfile.uuid,
            },
          }
        : undefined,
      govtId: uploadGovtId
        ? {
            connect: {
              uuid: uploadGovtId.uuid,
            },
          }
        : undefined,
      subscription: businessOwned
        ? {
            create: {
              type: "FREE",
              price: 0,
            },
          }
        : undefined,
      business:
        !!businessName && !!businessAddress
          ? {
              create: {
                name: businessName,
                phone,
                cac: uploadCacDoc
                  ? {
                      connect: {
                        uuid: uploadCacDoc.uuid,
                      },
                    }
                  : undefined,
                address: {
                  create: {
                    address: businessAddress,
                  },
                },
              },
            }
          : undefined,
      type: USER,
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

    await sendEmailToAdmin({
      subject: `A new user has been registered as ${user.type}`,
      html: `
        Hello Admin,
    
        A new user has registered on your platform with the following details:
        Email: ${user.email}
        Type: ${user.type}
        Registration Date: ${new Date().toLocaleString()}
    
        Please review the registration in the admin panel to verify user.
    
        This is an automated notification. Do not reply to this email.
      `,
    });

    return res.status(201).json(
      responseObject({
        message: "Registered successfully",
        accessToken: token,
      })
    );
  } catch (error) {
    logger(error)
    return errorHandler(res, error);
  }
};
