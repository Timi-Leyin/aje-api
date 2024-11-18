import { LISTING_TYPE, PRODUCT_TYPE } from "@prisma/client";

export interface createPropertyDTO {
  description: string;
  title: string;
  tags: string;
  type?: PRODUCT_TYPE;
  price: string | number;
  latitude:string|number;
  longitude:string|number;
  listingType: LISTING_TYPE;
  videoTour?:string;

  yearBuilt: string;
  squareFeet: string;
  bedrooms: number;
  bathrooms: number;
  address: string;
}
