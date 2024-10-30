// @types/express.d.ts
import { user } from "@prisma/client";
import express from "express";

declare module "express-serve-static-core" {
  interface Request {
    user: user;
  }
}

export interface GlobalUser {}
