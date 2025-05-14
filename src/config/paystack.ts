import Paystack from "../helpers/payments";

export const paystack = new Paystack({
  publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
  secretKey: process.env.PAYSTACK_SECRET_KEY!,
});
