import {
  integer,
  pgTable,
  serial,
  char,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
  message: varchar("messaage", { length: 4096 }).notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
  deleted: boolean("deleted").notNull().default(false),
  userId: integer("user_tg_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),
});
