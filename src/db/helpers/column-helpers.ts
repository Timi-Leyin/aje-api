import { text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

export const identifier = {
  id: varchar("id", { length: 100 }).default(nanoid()).unique().primaryKey(),
};

export const timestamps = {
  deleted_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
};
