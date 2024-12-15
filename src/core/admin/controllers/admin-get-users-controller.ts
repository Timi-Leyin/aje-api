import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { getPaginaionParams } from "../../../helpers/paginition";
import responseObject from "../../../helpers/response-object";
import adminServices from "../admin.services";

export default async (req: Request, res: Response) => {
  try {
    const { limit, offset, page } = getPaginaionParams(req);
    // const {query}  = req.query
    const data = await adminServices.getUsers({
      limit,
      offset,
      page,
    });

    return res.status(200).json(
      responseObject({
        message: "Users retrieved successfully",
        data,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
