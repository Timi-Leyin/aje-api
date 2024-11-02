import { file, LISTING_TYPE } from "@prisma/client";
import { db } from "../../config/database";
import logger from "../../helpers/logger";

interface getPropertiesParams {
  limit: number;
  offset: number;
  page: number;
}
const getProperties = async ({ limit, offset, page }: getPropertiesParams) => {
  const all = await db.property.count();

  const properties = await db.property.findMany({
    skip: offset,
    take: limit,
    include: {
      images: true,
    },
  });

  return {
    meta: {
      total: all,
      totalPages: Math.ceil(all / limit),
      limit,
      currentPage: page,
      offset,
    },
    data: properties,
  };
};

interface createPropertyParams {
  title: string;
  description: string;
  listingType: LISTING_TYPE;
  userId: string;
  tags: string;
  images: file[];
  price: string | number;
}
const createProperties = async ({
  title,
  description,
  listingType,
  userId,
  images,
  tags,
  price,
}: createPropertyParams) => {
  const tagsArray = (tags || "")
    .trim()
    .split(",")
    .filter((tag) => tag != "")
    .map((tag) => tag.toLowerCase().trim());


  const property = await db.property.create({
    data: {
      title,
      description,
      listingType: "RENT",
      price,
      images: {
        connect: images,
      },
      agent: {
        connect: {
          uuid: userId,
        },
      },
    },
  });

  return property;
};

const propertyService = {
  getProperties,
  createProperties,
};

export default propertyService;
