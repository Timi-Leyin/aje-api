import { Response } from "express";
import responseObject from "./response-object";
import logger from "./logger";

export default (res: Response, error: unknown) => {
  logger(error)
  return res.status(500).json(
    responseObject({
      message: "Internal Server Error",
    })
  );
};
