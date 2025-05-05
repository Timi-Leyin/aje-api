import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
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

const fileProviders = mysqlEnum("file_providers", ["cloudinary"]);
const authProviders = mysqlEnum("auth_providers", ["google", "default"]);

export const users = mysqlTable("users", {
  ...identifier,
  email: varchar({ length: 255 }).unique().notNull().unique(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  phone: varchar({ length: 15 }).notNull(),
  password: text(),

  auth_provider: authProviders.default("default"),
  user_type: userTypes.default("buyer"),

  last_login: timestamp().defaultNow(),
  ...timestamps,
});

export const usersRelations = relations(users, ({ one }) => ({
  profile_photo: one(files),
}));

export const files = mysqlTable("files", {
  ...identifier,
  src: text("src").notNull(),
  provider: fileProviders,
  ...timestamps,
});
