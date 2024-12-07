import { file } from "@prisma/client";
import { db } from "../../config/database";

interface createParams {
  userId: string;
  description: string;
  name: string;
  price: string;
  address: string;
  images: file[];
  phone: string;
}

const createMarketplace = async ({
  address,
  description,
  phone,
  images,
  name,
  price,
  userId,
}: createParams) => {
  const property = await db.property.create({
    data: {
      title: name,
      description,
      listingType: "SALE",
      type:"PRODUCT",
      address: {
        create: {
          address: String(address),
        },
      },
      price,
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
};

export default marketplaceService;
