import { db } from "../config/database";

export default async (userId: string, propertyId: string) => {
  if (!userId || !propertyId) {
    return;
  }

  //   ASUMING they exists
  const viewed = await db.property.update({
    where: {
      uuid: propertyId,
    },
    data: {
      views: {
        connect: {
          uuid: userId,
        },
      },
    },
  });

  return viewed;
};
