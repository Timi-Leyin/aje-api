import { Response } from "express";
import responseObject from "./response-object";
import logger from "./logger";
import { isAxiosError } from "axios";

export default (res: Response, error: unknown) => {
  if (isAxiosError(error)) {
    logger(error.response?.data.message);
  } else {
    // @ts-ignore
    // logger(JSON.stringify(error.response))
  }
  return res.status(500).json(
    responseObject({
      message: "Internal Server Error",
    })
  );
};
