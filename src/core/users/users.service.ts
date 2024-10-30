import { AUTH_PROVIDER, Prisma } from "@prisma/client";
import { db } from "../../config/database";
import otpGenerator from "otp-generator";
import logger from "../../helpers/logger";
import { comaparePassword, hashPassword } from "../../helpers/password";
import { checkExpiration } from "../../helpers/date";
const checkUserEmail = async (email: string, include: Prisma.userInclude) => {
  const user = db.user.findUnique({
    where: {
      email,
    },
    include,
  });

  return user;
};

const createUser = async (user: Prisma.userCreateInput) => {
  return db.user.create({
    data: user,
  });
};

const updatePassword = async (email: string, newPassword: string) => {
  const user = await checkUserEmail(email, {
    password: true,
  });

  if (!user) {
    return false;
  }
  const hashed = await hashPassword(newPassword);
  if (!user.password) {
    await db.user.update({
      where: {
        uuid: user.uuid,
      },
      data: {
        authProvider: AUTH_PROVIDER.EMAIL,
        password: {
          create: {
            content: hashed,
          },
        },
      },
    });
    return true;
  }

  await db.password.update({
    where: {
      uuid: user.password?.uuid,
    },
    data: {
      content: hashed,
    },
  });
  return true;
};

// OTP UTIL
const findOtp = async (email: string) => {
  const existingOtp = await db.otp.findFirst({
    where: {
      email,
    },
  });
  return existingOtp;
};

const compareOtp = async (otp: string, email: string) => {
  const existingOtp = await findOtp(email);
  if (!existingOtp) {
    return false;
  }

  const isExpired = checkExpiration(
    existingOtp.expiresIn,
    existingOtp.createdAt
  );
  logger(isExpired);
  if (isExpired) {
    return false;
  }
  const compare = await comaparePassword(otp, existingOtp?.code || "");
  return compare;
};

const generateOtp = async (email: string) => {
  // check if otp  is already generated for this email
  const existingOtp = await findOtp(email);
  if (existingOtp) {
    const isExpired = checkExpiration(
      existingOtp.expiresIn,
      existingOtp.createdAt
    );
    logger(isExpired);
    return isExpired;
  }

  const otp = otpGenerator.generate(6);
  logger("[CODE]", otp);
  const code = await hashPassword(otp);
  const newOTP = db.otp.create({
    data: {
      code,
      email,
      expiresIn: "5m",
    },
  });

  return true;
};

export const userService = {
  checkUserEmail,
  createUser,
  updatePassword,
  // otp
  generateOtp,
  compareOtp,
};
