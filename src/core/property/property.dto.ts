import { LISTING_TYPE, PRODUCT_TYPE } from "@prisma/client";

export interface createPropertyDTO {
  description: string;
  title: string;
  tags: string;
  type?: PRODUCT_TYPE;
  price: string | number;
  listingType: LISTING_TYPE;
}
