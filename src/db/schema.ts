import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  float,
  int,
  boolean,
  datetime,
} from "drizzle-orm/mysql-core";
import { identifier, timestamps } from "./helpers/column-helpers";
import { relations } from "drizzle-orm";

// #SAME IN AUTH/SCHEMA.ts
const userTypes = mysqlEnum("user_types", [
  "buyer",
  "agent",
  "vendor",
  "artisan",
  "admin",
]);

const fileProviders = mysqlEnum("file_provider", ["cloudinary", "self_hosted"]);
const authProviders = mysqlEnum("auth_provider", ["google", "default"]);
const verificationStatus = mysqlEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);
const trxStatus = mysqlEnum("transaction_status", [
  "pending",
  "failed",
  "success",
]);

const currency = mysqlEnum("currency", ["USD", "NGN"]);

export const users = mysqlTable("users", {
  ...identifier,
  email: varchar({ length: 255 }).unique().notNull().unique(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  phone: varchar({ length: 15 }).notNull(),
  verified: boolean().default(false),
  verification_status: verificationStatus,
  password: text(),

  auth_provider: authProviders.default("default"),
  user_type: userTypes.default("buyer"),

  bio: text(),
  services: text(),
  address: text(),
  city: varchar({ length: 30 }),
  available: boolean(),

  subscription_id: text("subscription_id"),

  last_login: timestamp().defaultNow(),
  fcm_token: text("fcm_token"),
  ...timestamps,
});

export const docsVerification = mysqlTable("docs_verification", {
  ...identifier,
  user_id: text().references(() => users.id),
  note: text(),
  ...timestamps,
});

export const docsVerificationRelations = relations(
  docsVerification,
  ({ one, many }) => ({
    user: one(users, {
      fields: [docsVerification.user_id],
      references: [users.id],
    }),
    ninDocs: many(files, { relationName: "ninDoc" }),
    cacDocs: many(files, { relationName: "cacDoc" }),
  })
);

export const gallery = mysqlTable("gallery", {
  ...identifier,
  user_id: text().references(() => users.id),
  ...timestamps,
});

export const galleryRelations = relations(gallery, ({ many, one }) => ({
  user_id: one(users, {
    fields: [gallery.user_id],
    references: [users.id],
  }),
  images: many(files),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile_photo: one(files),
  // gallery: many(gallery),
  properties: many(property),

  reviewsMade: many(review, {
    relationName: "author",
  }),

  reviews: many(review, {
    relationName: "artisan",
  }),

  subscription: one(subscription, {
    fields: [users.subscription_id],
    references: [subscription.id],
  }),
  verification: one(docsVerification, {
    fields: [users.id],
    references: [docsVerification.user_id],
  }),
}));

export const product = mysqlTable("product", {
  ...identifier,

  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  price: float().notNull(),
  currency: currency,
  lat: float(),
  lon: float(),
  city: varchar({ length: 100 }),
  address: varchar({ length: 255 }),
  type: varchar({ length: 50 }).notNull(),

  user_id: text().references(() => users.id),
  ...timestamps,
});

export const productRelations = relations(product, ({ one, many }) => ({
  user: one(users, {
    fields: [product.user_id],
    references: [users.id],
  }),
  reviews: many(review),
  images: many(files),
}));

export const property = mysqlTable("property", {
  ...identifier,
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  price: float().notNull(),
  currency: currency,
  amenities: text().default(""),
  lat: float(),
  lon: float(),
  city: varchar({ length: 100 }),
  youtube_link: varchar("youtube_link", { length: 150 }),
  address: varchar({ length: 255 }),
  listingType: varchar({ length: 25 }).notNull(),
  type: varchar({ length: 50 }).notNull(),
  bathrooms: int().default(0),
  beds: int().default(0),
  bedrooms: int().default(0),
  user_id: text("property_id").references(() => users.id),
  ...timestamps,
});

export const propertyRelations = relations(property, ({ many, one }) => ({
  images: many(files),
  schedules: many(schedule),
  reviews: many(review),
  user: one(users, {
    fields: [property.user_id],
    references: [users.id],
  }),
}));

export const advertisement = mysqlTable("advertisement", {
  ...identifier,
  title: text(),
  description: text(),
  cta: text(),
  cta_link: text(),
  ...timestamps,
});

export const advertisementRelations = relations(advertisement, ({ many }) => ({
  images: many(files),
}));

export const files = mysqlTable("files", {
  ...identifier,
  src: text("src").notNull(),
  name: varchar({ length: 100 }), // maybe idenffer for anything
  provider: fileProviders,
  property_id: text("property_id").references(() => property.id),
  user_id: text("user_id").references(() => users.id),
  product_id: text("product_id").references(() => product.id),
  gallery_id: text("gallery_id").references(() => gallery.id),
  nin_doc_id: text("nin_doc_id").references(() => docsVerification.id),
  cac_doc_id: text("cac_doc_id").references(() => docsVerification.id),
  advertisement_id: text("advertisement_id").references(() => advertisement.id),
  ...timestamps,
});

export const fileRelations = relations(files, ({ one }) => ({
  property_id: one(property, {
    fields: [files.property_id],
    references: [property.id],
  }),
  user_id: one(users, {
    fields: [files.user_id],
    references: [users.id],
  }),
  product_id: one(product, {
    fields: [files.product_id],
    references: [product.id],
  }),
  gallery_id: one(gallery, {
    fields: [files.gallery_id],
    references: [gallery.id],
  }),
  ninDocVerification: one(docsVerification, {
    fields: [files.nin_doc_id],
    references: [docsVerification.id],
    relationName: "ninDoc",
  }),
  cacDocVerification: one(docsVerification, {
    fields: [files.cac_doc_id],
    references: [docsVerification.id],
    relationName: "cacDoc",
  }),
  advertisement_id: one(advertisement, {
    fields: [files.advertisement_id],
    references: [advertisement.id],
  }),
}));

export const schedule = mysqlTable("schedule", {
  ...identifier,
  property_id: text("property_id").references(() => property.id),
  weekday: varchar({ length: 25 }),
  from: timestamp(),
  to: timestamp(),
  ...timestamps,
});

export const scheduleRelations = relations(schedule, ({ one }) => ({
  property_id: one(property, {
    fields: [schedule.property_id],
    references: [property.id],
  }),
}));

export const review = mysqlTable("review", {
  ...identifier,
  rating: int().default(0),
  message: text(),
  property_id: text("property_id").references(() => property.id),
  product_id: text("product_id").references(() => product.id),
  user_id: text("user_id").references(() => users.id),
  artisan_id: text("artisan_id").references(() => users.id),
  ...timestamps,
});

export const reviewRelations = relations(review, ({ one }) => ({
  property: one(property, {
    fields: [review.property_id],
    references: [property.id],
  }),

  product: one(product, {
    fields: [review.product_id],
    references: [product.id],
  }),

  artisan: one(users, {
    fields: [review.artisan_id],
    references: [users.id],
    relationName: "artisan",
  }),

  user: one(users, {
    fields: [review.user_id],
    references: [users.id],
    relationName: "author",
  }),
}));

export const notification = mysqlTable("notification", {
  ...identifier,
  title: text(),
  message: text(),
  type: varchar({ length: 50 }),
  read: boolean().default(false),
  user_id: text().references(() => users.id),
  ...timestamps,
});

export const notificationRelations = relations(notification, ({ one }) => ({
  user_id: one(users, {
    fields: [notification.user_id],
    references: [users.id],
  }),
}));

export const subscription = mysqlTable("subscription", {
  ...identifier,
  user_id: text().references(() => users.id),
  transaction_id: text().references(() => transaction.id),
  plan_name: text(),
  plan_code: text().notNull(),
  code: text(),
  active: boolean(),
  expired: boolean(),
  cancelled: boolean(),
  next_payment_at: datetime(),
  status: trxStatus.default("pending"),
  paid_at: datetime(),
  amount: float(),
  reties: int(),
  ...timestamps,
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(users, {
    fields: [subscription.user_id],
    references: [users.id],
  }),
  transaction: one(transaction, {
    fields: [subscription.transaction_id],
    references: [transaction.id],
  }),
}));

export const transaction = mysqlTable("transaction", {
  ...identifier,
  user_id: text().references(() => users.id),
  subscription_id: text(),
  plan_code: text().notNull(),
  status: trxStatus.default("pending"),
  amount: float(),
  fee: float(),
  paid_at: datetime(),
  ...timestamps,
});

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(users, {
    fields: [transaction.user_id],
    references: [users.id],
  }),
  subscription: one(subscription, {
    fields: [transaction.subscription_id],
    references: [subscription.id],
  }),
}));

export const report = mysqlTable("report", {
  ...identifier,
  category: text().notNull(),
  details: text(),
  property_id: text().references(() => property.id),
  product_id: text().references(() => product.id),
  artisan_id: text().references(() => users.id),
  ...timestamp,
});

export const reportRelations = relations(report, ({ one }) => ({
  property: one(property, {
    fields: [report.property_id],
    references: [property.id],
  }),
  product: one(product, {
    fields: [report.product_id],
    references: [product.id],
  }),
  artisan: one(users, {
    fields: [report.artisan_id],
    references: [users.id],
  }),
}));

// export const wishlist = mysqlTable("wishlist", {
//   ...identifier,
//   name: text().notNull(),
//   user_id: text().references(() => users.id),
//   ...timestamps,
// });

// export const wishlistRelations = relations(wishlist, ()=>({

// }
