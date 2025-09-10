export type PlanDetails = {
  name: string;
  period: "month" | "quarter" | "year";
  description: string;
  features: string[];
  highlights: string[];
};

