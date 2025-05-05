import { text, timestamp } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

export const timestamps = {
  deleted_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
};
