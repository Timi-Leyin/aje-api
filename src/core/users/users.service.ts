import { AUTH_PROVIDER, GENDER, Prisma } from "@prisma/client";
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

interface UpdateUser {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  gender?: GENDER;
  skills?:string;
}
const updateUser = async (email: string, data: UpdateUser) => {
  return db.user.update({
    where: {
      email,
    },
    data,
  });
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
  if (isExpired) {
    return false;
  }
  const compare = await comaparePassword(otp, existingOtp?.code || "");

  if (compare) {
    await db.otp.delete({
      where: {
        uuid: existingOtp.uuid,
      },
    });
  }
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
    if (isExpired) {
      await db.otp.delete({
        where: {
          uuid: existingOtp.uuid,
        },
      });

      return false;
    }
    return isExpired;
  }

  const otp = otpGenerator.generate(6);
  logger("[CODE]", otp);
  const code = await hashPassword(otp);
  const newOTP = await db.otp.create({
    data: {
      code,
      email,
      expiresIn: "5m",
    },
  });

  return otp;
};

export const userService = {
  checkUserEmail,
  createUser,
  updatePassword,
  updateUser,
  // otp
  generateOtp,
  compareOtp,
};
