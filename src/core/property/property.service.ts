import { db } from "../../config/database";

interface getPropertiesParams {
  limit: number;
  offset: number;
  page: number;
}
const getProperties = async ({ limit, offset, page }: getPropertiesParams) => {
  const all = await db.property.count();

  const properties = await db.property.findMany({
    skip: offset,
    take: limit,
    include: {
      images: true,
    },
  });

  return {
    meta: {
      total: all,
      limit,
      currentPage: page,
      offset,
    },
    data: properties,
  };
};

const propertyService = {
  getProperties,
};


export default propertyService