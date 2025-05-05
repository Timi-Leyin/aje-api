import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { identifier, timestamps } from "./helpers/column-helpers";

const userTypes = mysqlEnum("user_types", [
  "buyer",
  "agent",
  "vendor",
  "artisan",
  "admin",
]);

export const usersTable = mysqlTable("users", {
  ...identifier,
  email: varchar({ length: 255 }).notNull().unique(),
  first_name: varchar({ length: 50 }).notNull(),
  last_name: varchar({ length: 50 }).notNull(),
  phone: varchar({ length: 15 }).notNull(),
  password: text(),

  user_type: userTypes.default("buyer"),
  last_login: timestamp().defaultNow(),
  ...timestamps,
});
