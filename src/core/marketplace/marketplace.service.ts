import { CURRENCY, file } from "@prisma/client";
import { db } from "../../config/database";

interface createParams {
  userId: string;
  description: string;
  name: string;
  price: string;
  address: string;
  images: file[];
  tags?: string[];
  phone: string;
  moreInfo?: string;
  currency?: string;
}

interface editParams extends createParams {
  id: string;
  existingImages?: string[];
  tags?: string[];
}

const editMarketplace = async ({
  id,
  address,
  description,
  // phone,
  images,
  name,
  price,
  moreInfo,
  currency,
  existingImages = [],
  tags = [],
}: Omit<editParams, "phone">) => {
  // First, get the current property with its images
  const currentProperty = await db.property.findUnique({
    where: { uuid: id },
    include: {
      images: true,
      tags: true,
    },
  });

  if (!currentProperty) {
    throw new Error("Marketplace listing not found");
  }

  // Find images to disconnect (images that exist in DB but not in existingImages)
  const imagesToDisconnect = currentProperty.images.filter(
    (img) => !existingImages.includes(img.src)
  );

  // Process tags - remove duplicates
  const uniqueTags = [...new Set(tags)];

  // Update the property
  const property = await db.property.update({
    where: { uuid: id },
    data: {
      title: name,
      description,
      price: Number(price),
      moreInfo,
      currency: currency ? (currency.toUpperCase() as CURRENCY) : undefined,
      address: {
        update: {
          address: String(address),
        },
      },
      // Disconnect images that are no longer needed
      images: {
        disconnect: imagesToDisconnect.map((img) => ({ id: img.id })),
        // Connect new images
        connect: images,
      },
      // Update tags (first delete existing, then create new ones)
      tags: {
        deleteMany: {},
        create: uniqueTags.map((tag) => ({
          name: tag,
        })),
      },
    },
    include: {
      images: true,
      tags: true,
      address: true,
    },
  });

  return property;
};

const createMarketplace = async ({
  address,
  description,
  phone,
  images,
  tags,
  name,
  price,
  userId,
  moreInfo,
  currency,
}: createParams) => {
  const property = await db.property.create({
    data: {
      title: name,
      description,
      listingType: "SALE",
      type: "PRODUCT",
      moreInfo,
      address: {
        create: {
          address: String(address),
        },
      },
      tags: tags
        ? {
            createMany: {
              data: [
                ...(tags || [])?.map((t) => ({
                  name: t,
                })),
              ],
            },
          }
        : undefined,

      price,
      currency: currency ? (currency.toUpperCase() as CURRENCY) : undefined,
      phone,
      marketplace: true,
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

const marketplaceService = {
  createMarketplace,
  editMarketplace,
};

export default marketplaceService;
