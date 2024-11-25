import { USER_TYPE } from "@prisma/client";
import { db } from "../../config/database";

const getArtisans = async ({
  limit = 10,
  offset = 0,
  page = 1,
  filters,
}: {
  limit?: number;
  offset?: number;
  page?: number;
  filters?: { name?: string; location?: string };
}) => {
  // Build the filter conditions based on filters
  const filterConditions = {
    type: USER_TYPE.ARTISAN,
  };

  // Calculate the total number of artisans matching the criteria
  const totalItems = await db.user.count({
    where: filterConditions,
  });

  // Calculate offset for pagination
  const skip = offset || (page - 1) * limit;

  // Fetch paginated artisans
  const artisans = await db.user.findMany({
    where: filterConditions,
    skip,
    take: limit,
    include: {
      avatar: true,
      business: true,
    },
    orderBy: { createdAt: "desc" }, // Example: Sort by creation date
  });

  // Return the paginated response
  return {
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      limit,
      currentPage: page,
    },
    data: artisans,
  };
};

const artisanServices = {
  getArtisans,
};

export default artisanServices;
