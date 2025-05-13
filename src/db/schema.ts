import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  float,
  int,
  boolean,
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

const currency = mysqlEnum("currency", ["USD", "NGN"]);

export const users = mysqlTable("users", {
  ...identifier,
  email: varchar({ length: 255 }).unique().notNull().unique(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  phone: varchar({ length: 15 }).notNull(),
  verified: boolean().default(false),
  password: text(),

  auth_provider: authProviders.default("default"),
  user_type: userTypes.default("buyer"),

  bio: text(),
  services: text(),
  address: text(),
  city: varchar({ length: 30 }),
  available: boolean(),

  last_login: timestamp().defaultNow(),
  ...timestamps,
});

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
  // gallery: many(files),
  properties: many(property),
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
  user: one(users, {
    fields: [property.user_id],
    references: [users.id],
  }),
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
