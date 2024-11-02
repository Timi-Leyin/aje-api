// @types/express.d.ts
import { user } from "@prisma/client";
import express from "express";

declare module "express-serve-static-core" {
  interface Request {
    user: user;

    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };
  }
}

export interface GlobalUser {}


