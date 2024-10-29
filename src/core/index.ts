import { Request, Response } from "express";
import responseObject from "../helpers/response-object";

export const defaultMiddleware = (req: Request, res: Response) => {
  return res.status(200).json(
    responseObject({
      message: "API Service is Live",
    })
  );
};

export const notFoundMiddleware = (req: Request, res: Response) => {
  return res.status(404).json(
    responseObject({
      message: "Opps, Looks like you hit a wrong endpoint.",
    })
  );
};

export const errorMiddleware = (req: Request, res: Response) => {
  return res.status(500).json(
    responseObject({
      message: "An Error Occurred",
    })
  );
};

export const AccountAlreadyExist = (res: Response) => {
  return res.status(400).json(
    responseObject({
      message: "Account already exists",
    })
  );
};

export const AccountNotFound = (res: Response) => {
  return res.status(400).json(
    responseObject({
      message: "Account associated with credentials not found",
    })
  );
};

export const useProviderForAuth = (res: Response, provider: string) => {
  return res.status(400).json(
    responseObject({
      message: `Sign in with ${provider}`,
    })
  );
};
