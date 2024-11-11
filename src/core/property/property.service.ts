import {
  file,
  LISTING_TYPE,
  PRODUCT_TYPE,
  specifications,
  tag as Tag,
} from "@prisma/client";
import { db } from "../../config/database";
import logger from "../../helpers/logger";

interface getPropertiesParams {
  limit: number;
  offset: number;
  page: number;

  where?: {
    agentId?: string;
    title?: string;
    type?: PRODUCT_TYPE;
  };
}
const getProperties = async ({
  limit,
  offset,
  page,
  where,
}: getPropertiesParams) => {
  const all = await db.property.count({
    where: {
      userId: where && where.agentId,
      title: where && {
        contains: where.title,
      },
      type: where && where.type,
    },
  });

  logger(where && where.title);
  const properties = await db.property.findMany({
    where: {
      userId: where && where.agentId,
      title: where && {
        contains: where.title,
      },
      type: where && where.type,
    },
    skip: offset,
    take: limit,
    include: {
      images: {
        take: 1,
      },
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
type FilteredSpecifications = Partial<specifications>;

interface createPropertyParams {
  title: string;
  description: string;
  listingType: LISTING_TYPE;
  userId: string;
  tags: string;
  images: file[];
  type?: PRODUCT_TYPE;
  price: string | number;
  specifications?: FilteredSpecifications;
}

const createTags = async (tags: string[]) => {
  const allTags: Tag[] = [];
  for (const tag of tags) {
    const exists = await db.tag.findFirst({
      where: {
        name: tag,
      },
    });

    if (exists) {
      allTags.push(exists);
    } else {
      const newTag = await db.tag.create({
        data: {
          name: tag,
        },
      });
      allTags.push(newTag);
    }
  }

  return allTags;
};

const createProperties = async ({
  title,
  description,
  listingType,
  userId,
  images,
  tags,
  price,
  type,
  specifications,
}: createPropertyParams) => {
  const tagsArray = (tags || "")
    .trim()
    .split(",")
    .filter((tag) => tag != "")
    .map((tag) => tag.toLowerCase().trim());

  const allTags = await createTags(tagsArray);
  const property = await db.property.create({
    data: {
      title,
      description,
      type,
      listingType: listingType.toUpperCase() as LISTING_TYPE,
      price,
      tags: {
        connect: allTags,
      },
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
      agent: {
        select: {
          email: true,
          bio: true,
          type: true,
          firstName: true,
          lastName: true,
          root: true,
          phone: true,
          avatar: {
            select: {
              src: true,
              provider: true,
            },
          },
        },
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
  getProperty,
};

export default propertyService;
