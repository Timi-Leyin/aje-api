interface PaystackEventData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  message: string;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string;
  fees_breakdown: null;
  log: null;
  fees: 14500;
  customer: {
    id: number;
    email: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface PaystackEvent {
  event: string;
  data: PaystackEventData;
}
