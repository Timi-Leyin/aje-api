export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development", // or production
  PORT: process.env.PORT ?? 7000,
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",

  EMAIL_USER: process.env.EMAIL_USER ?? "",
  EMAIL_PASS: process.env.EMAIL_PASS ?? "",
  BACKEND_URL: process.env.BACKEND_URL ?? "",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "",

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",

  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
};
