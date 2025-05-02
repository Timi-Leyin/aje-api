import { LISTING_TYPE, PRODUCT_TYPE, PROPERTY_STATUS } from "@prisma/client";
import { db } from "../../../config/database";

export default (query: any) => {
  const where: any = {};

  //   status
  if (query.status) {
    if (query.status.toLowerCase().includes("rent")) {
      where.listingType = LISTING_TYPE.RENT;
    } else if (query.status.toLowerCase().includes("sale")) {
      where.listingType = LISTING_TYPE.SALE;
    }
  }

  //   prices: minPrice - maxPrice
  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) {
      where.price.gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      where.price.lte = Number(query.maxPrice);
    }
  }

  // propertyTypes
  if (
    query.propertyTypes &&
    Array.isArray(query.propertyTypes) &&
    query.propertyTypes.length > 0
  ) {
    where.propertyType = {
      some: {
        name: {
          in: query.propertyTypes.map((type) => type.toString()),
        },
      },
    };

    const listingOr: any[] = [];
    if (where.propertyTypes?.toLowerCase().includes("hotel")) {
      listingOr.push({
        listingType: LISTING_TYPE.RENT,
      });
    }
    if (where.propertyTypes?.toLowerCase().includes("propert")) {
      listingOr.push({
        listingType: LISTING_TYPE.SALE,
      });
    }
    if (where.propertyTypes?.toLowerCase().includes("short")) {
      listingOr.push({
        listingType: LISTING_TYPE.SHORTLET,
      });
    }

    where.OR = where.OR ? [...where.OR, ...listingOr] : listingOr;
  }

  //   bedrooms
  if (
    query.bedrooms &&
    Array.isArray(query.bedrooms) &&
    query.bedrooms.length > 0
  ) {
    // Initialize specifications filter if not already present
    where.specifications = where.specifications || {};

    if (query.bedrooms.includes("4+")) {
      where.specifications.OR = [
        {
          bedrooms: {
            gte: 4,
          },
        },
      ];

      // Add specific bedroom counts if any
      const regularBedrooms = query.bedrooms
        .filter((b) => b !== "4+")
        .map((b) => Number(b));

      if (regularBedrooms.length > 0) {
        where.specifications.OR.push({
          bedrooms: {
            in: regularBedrooms,
          },
        });
      }
    } else {
      where.specifications.bedrooms = {
        in: query.bedrooms.map((b) => Number(b)),
      };
    }
  }

  //   amenities
  if (
    query.amenities &&
    Array.isArray(query.amenities) &&
    query.amenities.length > 0
  ) {
    const amenitiesArray = query.amenities as string[];

    amenitiesArray.forEach((amenity) => {
      where.tags = where.tags || {};
      where.tags.some = where.tags.some || {};
      where.tags.some.OR = where.tags.some.OR || [];
      where.tags.some.OR.push({
        name: amenity,
      });
    });
  }

  // Handle search term
  if (query.search) {
    const searchTerm = query.search.toString().trim();

    if (searchTerm) {
      const searchOR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { moreInfo: { contains: searchTerm } },
        {
          tags: {
            some: {
              name: { contains: searchTerm },
            },
          },
        },
      ];

      where.OR = where.OR ? [...where.OR, ...searchOR] : searchOR;
    }
  }

  // Determine sort order
  let orderBy: any = {};
  if (query.order) {
    switch (query.order.toString()) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" }; // Default to newest
    }
  } else {
    orderBy = { createdAt: "desc" };
  }

  // return to always be property
  if (!query?.type) {
    where.type = PRODUCT_TYPE.PROPERTY;
  }
  return where;
};
