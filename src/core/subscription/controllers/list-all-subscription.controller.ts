import { Request, Response } from "express";
import errorHandler from "../../../helpers/error-handler";
import { paystack } from "../../../config/paystack";
import responseObject from "../../../helpers/response-object";

export default async (req: Request, res: Response) => {
  try {
    const plans = await paystack.listPlans();

    const filteredPlans = plans.map((plan) => {
      return {
        id: plan.plan_code,
        name: plan.name,
        amount: plan.amount / 100,
        description: plan.description,
      };
    });

    res.status(200).json(
      responseObject({
        message: "Plans Retrieved",
        data: filteredPlans,
      })
    );
  } catch (error) {
    return errorHandler(res, error);
  }
};
