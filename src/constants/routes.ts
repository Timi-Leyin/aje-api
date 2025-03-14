export const ROUTES = {
  BASE: "/api",
  INDEX: "/",
  INDEX_ID: "/:id",
  NEW: "/new",
  INITIALIZE: "/initialize",
  CREATE_PASSWORD: "/create-password",
  INSIGHTS: "/insights",
  CURRENT_SUB: "/current",
  SUBSCRIBE: "/subscribe",
  CANCEL: "/cancel",
  PRODUCT_ID: "/:productId",
  UPLOAD_GALLERY: "/upload-gallery",
  SUBROUTES: {
    AUTH: "/auth",
    ARTISAN: "/artisan",
    MARKETPLACE:"/marketplace",
    REVIEWS: "/reviews",
    SUBSCRIPTION: "/subscription",
    PROFILE: "/profile",
    ARTIST: "/artist",
    ADMIN: "/admin",
    AD: "/ads",
    PROPERTY: "/property",
    ARTWORK: "/artwork",
    PAYSTACK_WEBHOOK: "/paystack/webhook",
    SALES: "/sales",
  },
  MY_PROPERTY: "/my-property",

  // AUTH
  LOGIN: "/login",
  REGISTER: "/register",
  CHECK_EMAIL: "/check-email",
  GOOGLE_AUTH: "/google",
  GOOGLE_AUTH_CALLBACK: "/google/callback",
  GOOGLE_AUTH_CALLBACK_SUCCESS: "/google/callback/success",
  GOOGLE_AUTH_CALLBACK_FAILURE: "/google/callback/failure",
  FORGOTTEN_PASSWORD: "/forgot-password",
  VERIFY_FORGOTTEN_PASSWORD: "/forgot-password/verify",

  // ARTISTS MANAGER
  CREATE_MANAGER: "/artist-manager/new",
  ARTIST_MANAGER_REQUESTS: "/artist-manager/requests",

  // PROFILE
  // CREATE_STORE: "/create-store",
};
