import { db } from "../../config/database";

interface getReviewsParams {
  limit: number;
  offset: number;
  page: number;

  propertyId: string;
}

interface addReview {
  title: string;
  content: string;
  rating: number;

  userEmail: string;
  productId: string;
}

const getReviews = async ({
  limit,
  offset,
  page,
  propertyId,
}: getReviewsParams) => {
  const all = await db.reviews.count({
    where: {
      propertyId,
    },
  });

  const reviews = await db.reviews.findMany({
    where: {
      propertyId,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    skip: offset,
    take: limit,
  });

  return {
    meta: {
      totalItems: all,
      totalPages: Math.ceil(all / limit),
      limit,
      currentPage: page,
    },
    data: reviews,
  };
};

const addReview = async ({
  title,
  content,
  rating,
  userEmail,
  productId,
}: addReview) => {
  const review = await db.reviews.create({
    data: {
      title,
      content,
      rating,
      user: {
        connect: {
          email: userEmail,
        },
      },
      property: {
        connect: {
          uuid: productId,
        },
      },
    },
  });

  return review;
};

const reviewServices = {
  getReviews,
  addReview,
};

export default reviewServices;
