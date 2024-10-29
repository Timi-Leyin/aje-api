import { Response } from "express";
import responseObject from "./response-object";

export default (res: Response, error: unknown) => {
  return res.status(500).json(
    responseObject({
      message: "Internal Server Error",
    })
  );
};
