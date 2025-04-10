import { LISTING_TYPE, PRODUCT_TYPE, PROPERTY_STATUS } from "@prisma/client";

export interface createPropertyDTO {
  description: string;
  title: string;
  tags: string;
  type?: PRODUCT_TYPE;
  price: string | number;
  currency?:string;
  latitude: string | number;
  longitude: string | number;
  listingType: LISTING_TYPE;
  status: string;
  propertyId: string;
  videoTour?: string;

  yearBuilt: string;
  squareFeet: string;
  bedrooms: number;
  bathrooms: number;
  address: string;
}
