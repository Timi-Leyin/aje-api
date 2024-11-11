import { ENV } from "../constants/env";
import Paystack from "../helpers/payments";

export const paystack = new Paystack({
  publicKey: ENV.PAYSTACK_PUBLIC_KEY as string,
  secretKey: ENV.PAYSTACK_SECRET_KEY,
});

