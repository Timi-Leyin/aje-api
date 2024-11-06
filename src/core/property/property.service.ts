import { file, LISTING_TYPE, specifications } from "@prisma/client";
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
      totalItems: all,
      totalPages: Math.ceil(all / limit),
      limit,
      currentPage: page,
    },
    data: properties,
  };
};
type FilteredSpecifications = Omit<
  specifications,
  "id" | "createdAt" | "updatedAt" | "uuid"
>;

interface createPropertyParams {
  title: string;
  description: string;
  listingType: LISTING_TYPE;
  userId: string;
  tags: string;
  images: file[];
  price: string | number;
  specifications?: FilteredSpecifications;
}
const createProperties = async ({
  title,
  description,
  listingType,
  userId,
  images,
  tags,
  price,
  specifications,
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
      specifications: specifications
        ? {
            create: {
              ...specifications,
            },
          }
        : undefined,
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

const getProperty = async ({ uuid }: { uuid: string }) => {
  const property = await db.property.findUnique({
    where: {
      uuid: uuid,
    },
    include: {
      images: true,
      specifications: true,
      tags: true,
      agent:{
        select:{
          email:true,
          bio:true,
          firstName:true,
          lastName:true,
          root:true,
          phone:true,
          avatar:{
            select:{
               src:true,
               provider:true,
            }
          },
        }
      },
      videoTour: true,
      propertyType: true,
    },
  });
  return property;
};

const propertyService = {
  getProperties,
  createProperties,
  getProperty
};

export default propertyService;
