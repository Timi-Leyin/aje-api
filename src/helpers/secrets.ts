import bcrypt from "bcryptjs";
import { decode, sign, verify } from "hono/jwt";

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comaprePassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export interface JwtPayload {
  id: string;
}

export const generateJWT = async (payload: JwtPayload) => {
  const _payload = {
    timestamp: Date.now(),
    ...payload,
    // exp: Math.floor(Date.now() / 1000) + 60 * 5, 5mins
  };
  return await sign(_payload, process.env.JWT_SECRET);
};
