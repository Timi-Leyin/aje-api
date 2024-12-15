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
  filters?: { name?: string; location?: string; query?: string };
}) => {
  const filtersQuery =
    filters?.query?.split(",").map((skill) => skill.trim()) || [];

  // Build the filter conditions based on filters
  const filterConditions = {
    type: USER_TYPE.ARTISAN,
    OR: filters?.query? [
      // Check if any skill matches
      ...filtersQuery.map((querySkill) => ({
        skills: {
          contains: querySkill,
        },
      })),
      // Check if any word matches in the bio
      ...filtersQuery.map((queryWord) => ({
        bio: {
          contains: queryWord,
        },
      })),
    ]:undefined,
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
