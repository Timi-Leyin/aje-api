import { db } from "../../config/database";

export default {
  async getUsers({ limit, offset, page }) {
    const totalItems = await db.user.count({});

    // Calculate offset for pagination
    const skip = offset || (page - 1) * limit;

    // Fetch paginated artisans
    const users = await db.user.findMany({
      //   where: filterConditions,
      skip,
      take: limit,
      include: {
        avatar: true,
        business: {
          include: {
            cac: true,
          },
        },
        subscription: true,
        govtId: true,
      },
    });

    // Return the paginated response
    return {
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        limit,
        currentPage: page,
      },
      data: users,
    };
  },
};
