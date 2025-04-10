import {
  file,
  LISTING_TYPE,
  Prisma,
  PRODUCT_TYPE,
  PROPERTY_STATUS,
  specifications,
  tag as Tag,
} from "@prisma/client";
import { db } from "../../config/database";
import logger from "../../helpers/logger";
import { FILTERED } from "./controllers/properties.controller";

interface getPropertiesParams {
  limit: number;
  offset: number;
  page: number;

  where?: {
    agentId?: string;
    title?: string;
    type?: PRODUCT_TYPE;
    minPrice?: number;
    maxPrice?: number;
    hasLegalDocuments?: boolean;
    tags?: string;
    listingType?: LISTING_TYPE;
    status?: PROPERTY_STATUS;
    bathroom?: string | number;
    bedroom?: string | number;
    tag?: string;
    marketplace?: string;
  };

  filters?: {
    by?: FILTERED;
    listingType?: "Rent" | "Sale" | "Shotlet" | "Hotel";
    value?: string | number | boolean;
  };
}

const getProperties = async ({
  limit,
  offset,
  page,
  where,
  filters,
}: getPropertiesParams) => {
  console.log(where?.maxPrice);
  const marketplace = Boolean(where?.marketplace == "true");
  // console.log(await db.property.count(), "PT");
  const filterConditions: Prisma.propertyWhereInput = {
    userId: where?.agentId,
    title: where?.title ? { contains: where.title } : undefined,
    OR: [
      {
        tags: where?.listingType
          ? {
              some: { name: { contains: where?.listingType } },
            }
          : undefined,
      },
      {
        tags: {
          some: { name: { contains: where?.title } },
        },
      },
      {
        address: {
          address: { contains: where?.title },
        },
      },
      {
        description: {
          contains: where?.title,
        },
      },
      {
        listingType: filters?.listingType?.toLocaleUpperCase() as LISTING_TYPE,
      },
    ],

    listingType: filters?.listingType
      ? (filters?.listingType?.toLocaleUpperCase() as LISTING_TYPE)
      : undefined,

    marketplace: {
      equals: marketplace,
    },
    type: where?.type,
    price:
      where?.minPrice && where?.maxPrice
        ? { gt: where.minPrice, lte: where.maxPrice }
        : undefined,
    // hasLegalDocuments: where?.hasLegalDocuments,
    tags:
      filters && filters?.by == "tags" && filters.value
        ? { some: { name: { contains: filters.value as string } } }
        : where && where.tag
        ? {
            some: {
              name: {
                contains: where.tag.toLowerCase(),
              },
            },
          }
        : undefined,

    // status: where?.status,
    specifications:
      where && (where.bathroom || where.bedroom)
        ? {
            bathrooms: where?.bathroom
              ? {
                  gte: Number(where.bathroom),
                }
              : undefined,
            bedrooms: where?.bedroom
              ? {
                  gte: Number(where.bedroom),
                }
              : undefined,
          }
        : undefined,
  };

  // logger(where);
  const all = await db.property.count({
    where: filterConditions,
  });

  console.log("MiN", where?.minPrice);
  console.log("MAX", where?.maxPrice);
  const properties = await db.property.findMany({
    where: filterConditions,
    skip: offset,
    take: limit,
    include: {
      images: { take: 1 },
      address: true,
      tags: true,
    },
    orderBy:
      filters?.by === "top-reviewed"
        ? { reviews: { _count: "desc" } }
        : undefined,
  });

  console.log(properties.length);
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
  videoTour?: string;
  longitude?: string | number;
  latitude?: string | number;
  address?: string;
  images: file[];
  type?: PRODUCT_TYPE;
  price: string | number;
  specifications?: FilteredSpecifications;
}
interface editPropertyParams {
  title: string;
  description: string;
  listingType: LISTING_TYPE;
  userId: string;
  propertyId: string;
  status: PROPERTY_STATUS;
  // tags: string;
  videoTour?: string;
  // longitude?: string | number;
  // latitude?: string | number;
  address?: string;
  // images: file[];
  // type?: PRODUCT_TYPE;
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
  videoTour,
  price,
  type,
  specifications,
  address,
  latitude,
  longitude,
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
      marketplace: type == "PRODUCT" ? true : false,
      listingType: listingType.toUpperCase() as LISTING_TYPE,
      address: {
        create: {
          address: String(address),
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
      },
      price,
      tags: {
        connect: allTags,
      },
      videoTour: videoTour
        ? {
            create: {
              src: videoTour,
              provider: "OTHERS",
            },
          }
        : undefined,
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
const updateProperties = async ({
  title,
  description,
  listingType,
  userId,
  propertyId,
  // images,
  // tags,
  videoTour,
  price,
  status,
  // type,
  specifications,
  address,
}: editPropertyParams) => {
  const property = await db.property.update({
    where: {
      uuid: propertyId,
      userId: userId,
    },
    data: {
      title,
      description,
      // type,
      listingType: listingType.toUpperCase() as LISTING_TYPE,
      address: {
        update: {
          address: String(address),
        },
      },
      price,
      status,
      videoTour: videoTour
        ? {
            update: {
              src: videoTour,
              provider: "OTHERS",
            },
          }
        : undefined,
      specifications: specifications
        ? {
            update: {
              ...specifications,
            },
          }
        : undefined,
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
          business: {
            include: {
              address: true,
            },
          },
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
      address: true,
      videoTour: true,
      propertyType: true,
    },
  });
  return property;
};

const getMoreFromAgent = async ({
  userId,
  limit = 5,
}: {
  userId: string;
  limit: number;
}) => {
  const properties = await db.property.findMany({
    where: {
      userId,
    },
    take: Math.min(5, limit),
    include: {
      images: { take: 1 },
      address: true,
    },
  });

  return properties;
};

const propertyService = {
  getProperties,
  createProperties,
  getProperty,
  updateProperties,
  getMoreFromAgent,
};

export default propertyService;
