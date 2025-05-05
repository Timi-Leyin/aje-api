import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  type AnyMySqlColumn,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { identifier, timestamps } from "./helpers/column-helpers";
import { relations } from "drizzle-orm";

const userTypes = mysqlEnum("user_types", [
  "buyer",
  "agent",
  "vendor",
  "artisan",
  "admin",
]);

const fileProviders = mysqlEnum("file_providers", ["cloudinary"]);
const authProviders = mysqlEnum("auth_providers", ["google", "default"]);

export const usersTable = mysqlTable("users", {
  ...identifier,
  email: varchar({ length: 255 }).notNull().unique(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  phone: varchar({ length: 15 }).notNull(),
  password: text(),

  auth_provider: authProviders.default("default"),
  user_type: userTypes.default("buyer"),

  last_login: timestamp().defaultNow(),
  ...timestamps,
});

export const usersRelations = relations(usersTable, ({ one }) => ({
  profile_photo: one(filesTable),
}));

export const filesTable = mysqlTable("files", {
  ...identifier,
  src: text("src").notNull(),
  provider: fileProviders,
  ...timestamps,
});
