import { Prisma } from "@prisma/client";
import { db } from "../../config/database";

export const checkUserEmail = async (
  email: string,
  include: Prisma.userInclude
) => {
  const user = db.user.findUnique({
    where: {
      email,
    },
    include,
  });

  return user;
};

export const createUser = async (user: Prisma.userCreateInput) => {
  return db.user.create({
    data: user,
  });
};
