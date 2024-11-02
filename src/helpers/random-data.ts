import { faker } from "@faker-js/faker";
import bcryptjs from "bcryptjs";
import { db } from "../config/database";
import { USER_TYPE } from "@prisma/client";
import propertyService from "../core/property/property.service";
import { bulkFileUploader } from "./file-uploader";
import logger from "./logger";
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

const possibleTags = [
  "Luxury",
  "Pet-Friendly",
  "Near School",
  "Garden",
  "Pool",
  "Newly Renovated",
  "City View",
  "Mountain View",
  "Beachfront",
  "Gated Community",
  "Eco-Friendly",
  "Close to Transport",
];

const fakeUpload = async (length = 5) => {
  const images = Array.from({ length: 5 }, () => faker.image.url());
  return await bulkFileUploader(
    images.map((img) => {
      return {
        src: img,
      };
    })
  );
};

export const createRandomProperty = async () => {
  const uploads = await fakeUpload(5);
  await propertyService.createProperties({
    title: faker.commerce.productName(),
    description: faker.lorem.sentences(3),
    listingType: faker.helpers.arrayElement(["RENT", "RENT"]),
    price: faker.commerce.price({ min: 10000, max:99999999 }),
    tags: possibleTags.join(","),
    images: uploads,
    specifications: {
      bathrooms: faker.number.int({ min: 1, max: 5 }),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      furnishing: faker.helpers.arrayElement([
        "UNFURNISHED",
        "SEMI_FURNISHED",
        "FURNISHED",
      ]),
      garden: faker.helpers.arrayElement([true, false]),
      gym: faker.helpers.arrayElement([true, false]),
      parkingSpaces: faker.number.int({ max: 3 }),
      pool: faker.helpers.arrayElement([true, false]),

      yearBuilt: new Date(),
      lotSize: null,
      squareFeet: null,
    },
    userId: "cm2zhv7fs0000e1czdpl6gg4m",
  });
};

export const multipleProperty = async (max = 500) => {
  for (let i = 1; i <= max; i++) {
    logger("[RANDOM PROPERTY]", i);
    await createRandomProperty();
  }
};
