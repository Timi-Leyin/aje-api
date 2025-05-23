import jwt from "jsonwebtoken";
import { ENV } from "../constants/env";
import { db } from "../config/database";
import { user as User } from "@prisma/client";
import logger from "./logger";

interface Payload {
  id: string;
}
export const generateToken = async (payload: Payload) => {
  return await jwt.sign(payload, ENV.JWT_SECRET);
};

export interface GUser extends User{

}
interface Decoded {
  user?:  GUser| null;
  error?: string;
}

export const decodeToken = async (token: string): Promise<Decoded> => {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as Payload;
    const user = await db.user.findUnique({
      where: { uuid: decoded.id },
      include: {
        avatar: true,
        subscription: true,
        gallery: true,
        business: {
          include: {
            address: true,
          },
        },
      },
    });
    
    return {
      user,
      error: user ? "" : "Invalid authorization",
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        user: undefined,
        error: "Token has expired",
      };
    }
    return {
      user: undefined,
      error: "Invalid token",
    };
  }
};
