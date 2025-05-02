import { Request, Response } from "express";
import errorHandler from "../../../../helpers/error-handler";
import { getPaginaionParams } from "../../../../helpers/paginition";
import propertyQuery from "../../../helpers/build-query/property-query";
import { db } from "../../../../config/database";
import responseObject from "../../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const { query } = req;
    const { limit, offset, page } = getPaginaionParams(req);
    const queryBuilder = propertyQuery(
      JSON.parse((query.newQuery as string) || "{}")
    );

    const count = await db.property.count({ where: queryBuilder });
    const properties = await db.property.findManyRandom(limit, {
      where: queryBuilder,
      //   skip: offset,
      //   take: limit,

      //   skip: Math.floor(Math.random() * (count - limit)),
      //   include: {
      //     images: true,
      //     address: true,
      //     tags: true,
      //   },
      select: {
        type: true,
        images: true,
        address: true,
        tags: true,
        addressId: true,
        agent: true,
        createdAt: true,
        currency: true,
        description: true,
        hasLegalDocuments: true,
        id: true,
        listingType: true,
        marketplace: true,
        moreInfo: true,
        phone: true,
        price: true,
        propertyType: true,
        reviews: true,
        specifications: true,
        specificationsId: true,
        status: true,
        title: true,
        tourFileId: true,
        updatedAt: true,
        userId: true,
        uuid: true,
        videoTour: true,
        views: true,
      },
      custom_uniqueKey: "id",
    });

    return res.status(200).json(
      responseObject({
        message: "Retrived Properties",
        data: {
          meta: {
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            limit,
            currentPage: page,
          },
          data: properties,
        },
      })
    );
  } catch (error) {
    console.log(error);
    return errorHandler(res, error);
  }
};
