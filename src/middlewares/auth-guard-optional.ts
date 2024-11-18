import { NextFunction, Request, Response } from "express";
import responseObject from "../helpers/response-object";
import { decodeToken } from "../helpers/token";

export default async (req: Request, res: Response, next: NextFunction) => {
  // retrieve the authorization header
  const authHeader = req.headers.authorization ?? "";
  const [bearer, accessToken] = authHeader.split(" ") ?? [];

  if (bearer && accessToken) {
    const decoded = await decodeToken(accessToken);

    if (decoded.user) {
      req.user = decoded.user;
    }
  }

  return next();
};
