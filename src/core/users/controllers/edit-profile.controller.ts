import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { userService } from "../users.service";
import responseObject from "../../../helpers/response-object";
import { updateProfileDTO } from "../users.dto";

export default async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, bio, skills } = req.body as updateProfileDTO;
    // TODO [] update gender
    // @ts-ignore
    await userService.updateUser(req.user.email, {
      firstName,
      lastName,
      bio,
      // @ts-ignore
      skills: req.user.type == "ARTISAN" ? skills : undefined,
    });

    return res.status(200).json(
      responseObject({
        message: "User updated successfully",
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
