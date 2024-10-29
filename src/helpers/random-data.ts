import { faker } from "@faker-js/faker";
import bcryptjs from "bcryptjs";
import { db } from "../config/database";
import { USER_TYPE } from "@prisma/client";
// FOR TEST PURPOSES ON;Y

export const PASSWORD = "Tester@admin.1";
export const createRandomUser = async (type?: USER_TYPE) => {
  return await db.user.create({
    data: {
      email: faker.internet.email(),
      firstName: faker.internet.displayName(),
      lastName: faker.internet.displayName(),
      type,
      authProvider: "EMAIL",
      password: {
        create: {
          content: await bcryptjs.hash(PASSWORD, 10),
        },
      },
    },
  });
};

export const getRandomUserInfo = () => {
  return {
    email: faker.internet.email(),
    firstName: faker.internet.displayName(),
    lastName: faker.internet.displayName(),
    password: PASSWORD,
  };
};
