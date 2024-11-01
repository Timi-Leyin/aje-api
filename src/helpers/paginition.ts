import { Request } from "express";
import { DATA_LIMIT } from "../constants";

export const getPaginaionParams = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const reqLimit = parseInt(req.query.limit as string) || DATA_LIMIT;
  const limit = Math.min(reqLimit, DATA_LIMIT);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};
