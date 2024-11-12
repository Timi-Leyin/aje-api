import axios, { AxiosInstance, AxiosResponse } from "axios";

const PAYSTACK_BASE = "https://api.paystack.co";

interface Options {
  secretKey?: string;
  publicKey: string;
}

interface createSubscriptionPayload {
  customer: string;
  plan: string;
  start_date?: string; // ISO Date String
}

interface createSubResponse {
  customer: number;
  plan: number;
  integration: number;
  domain: string;
  start: number;
  status: string;
  quantity: number;
  amount: number;
  authorization: number;
  invoice_limit: number;
  split_code: string | null;
  subscription_code: string;
  email_token: string;
  id: number;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  cron_expression: string;
  next_payment_date: string;
}

interface CreateCustomerResponse {
  transactions: any[];
  subscriptions: any[];
  authorizations: any[];
  email: string;
  integration: number;
  domain: string;
  customer_code: string;
  risk_action: string;
  id: number;
  createdAt: string;
  updatedAt: string;
  identified: boolean;
  identifications: null;
}

interface createCustomerPayload {
  email: string;
}

interface initTransactionParams {
  email: string;
  amount: number;
  metadata?: any;
}

interface initTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface Plan {
  subscriptions: any[];
  pages: any[];
  domain: string;
  name: string;
  plan_code: string;
  description: string;
  amount: number;
  interval: string;
}

type getPlansResponse = Plan[];
type getPlanResponse = Plan;

interface cancelSubscriptionParams {
  code: string;
  token: string;
}
interface cancelSubscriptionResponse {}

const Paystack = class Paystack {
  private options: Options;
  private api: AxiosInstance;
  constructor(options: Options) {
    this.options = options;
    this.api = axios.create({
      baseURL: PAYSTACK_BASE,
      headers: {
        Authorization: `Bearer ${options.secretKey}`,
      },
    });
  }

  /**
   * CREATE SUBSCRIPTION
   **/

  createSubscription = async (data: createSubscriptionPayload) => {
    try {
      const response = await this.api.post<
        AxiosResponse<createSubResponse, any>
      >("/subscription", data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * CREATE CUSTOMER
   **/
  createCustomer = async (data: createCustomerPayload) => {
    try {
      const response = await this.api.post<
        AxiosResponse<CreateCustomerResponse, any>
      >("/customer", data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };
  /**
   * Initialize TRansaction
   **/

  initTransaction = async (data: initTransactionParams) => {
    try {
      const response = await this.api.post<
        AxiosResponse<initTransactionResponse, any>
      >("/transaction/initialize", data);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * LIST PLANS
   **/
  listPlans = async () => {
    try {
      const response = await this.api.get<AxiosResponse<getPlansResponse, any>>(
        "/plan"
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };
  /**
   * LIST PLANS
   **/
  getPlan = async (code: string) => {
    try {
      const response = await this.api.get<AxiosResponse<getPlanResponse, any>>(
        `/plan/${code}`
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * CANCEL SUBSCRIPTION
   **/

  cancelSubscription = async (data: cancelSubscriptionParams) => {
    const response = await this.api.post<
      AxiosResponse<cancelSubscriptionResponse, any>
    >("/subscription/disable", data);
    return response.data.data;
  };
};

export default Paystack;
