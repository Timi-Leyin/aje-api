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

interface getSubscriptionPayload {
  code: string;
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
  plan?: string;
  reference?: string;
  amount: number;
  metadata?: any;
  callback_url?: string;
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

interface verifyTransactionResponse {
  id: number;
  domain: string;
  amount: number;
  currency: string;
  source: string;
  reason: string;
  recipient: number;
  status: string;
  transfer_code: string;
  titan_code: string;
  transferred_at: string;
  idempotency_key: string;
  integration: number;
  fee_charged: number;
  subaccount: any;
  account: any;
  customer: any;
  authorization: any;
  channel: string;
  gateway_response: string;
  fees_breakdown: any;
  metadata: any;
  log: any;
  fees: number;
  paid_at: string;
  requested_amount: number;
  pos_transaction_data: any;
  source_details: any;
  destination_details: any;
  authorization_url: string;
  transfer_fee: number;
  transfer_fee_breakdown: any;
  transaction_date: string;
  plan: string;
  subaccount_code: string;
  account_code: string;
  customer_code: string;
  customer_info: any;
  customer_details: any;
  requested_currency: string;
  transaction_type: string;
  reference: string;
  created_at: string;
  updated_at: string;
}

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
  getSubscription = async (data: getSubscriptionPayload) => {
    try {
      const response = await this.api.get<
        AxiosResponse<createSubResponse, any>
      >(`/subscription/${data.code}`);
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

  /**
   * VERIFY TRANSACTION
   **/

  verifyTransaction = async (reference: string) => {
    try {
      const response = await this.api.get<
        AxiosResponse<verifyTransactionResponse, any>
      >(`/transaction/verify/${reference}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * GET SUBSCRIPTION DETAILS
   **/

  getSubscriptionDetails = async (code: string) => {
    try {
      const response = await this.api.get<
        AxiosResponse<createSubResponse, any>
      >(`/subscription/${code}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };
};

export default Paystack;
