export declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      CLOUDINARY_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
      BACKEND_URL: string;
      FRONTEND_URL: string;
      SESSION_SECRET: string;
      EXPO_APP_SCHEME: string;
      PLUNK_API_KEY: string;

      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;

      PAYSTACK_PUBLIC_KEY: string;
      PAYSTACK_SECRET_KEY: string;
    }
  }
}
