import { LISTING_TYPE } from "@prisma/client";

export interface createPropertyDTO {
  description: string;
  title: string;
  tags: string;
  price: string | number;
  listingType: LISTING_TYPE;
}
