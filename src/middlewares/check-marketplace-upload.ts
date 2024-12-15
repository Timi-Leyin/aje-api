import { NextFunction, Request, Response } from "express";
import propertyService from "../core/property/property.service";
import { db } from "../config/database";
import responseObject from "../helpers/response-object";

export default async (req: Request, res: Response, next:NextFunction) => {
  // @ts-ignore
  const { uuid } = req.user;

  const property = await db.property.count({
    where: {
      marketplace: true,
      agent: {
        uuid,
      },
    },
  });

  if (property >= 1) {
    return res.status(400).json(
      responseObject({
        message: "You are only Allowed to upload one product in Marketplace",
      })
    );
  }

  return next()
};
