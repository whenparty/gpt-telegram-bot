import {
  integer,
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { aiModelEnum } from "./enums";

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    role: varchar("role", { enum: ["user", "assistant"] }).notNull(),
    text: varchar("message", { length: 4096 }).notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
    deleted: boolean("deleted").notNull().default(false),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
    aiModel: aiModelEnum("ai_model").notNull(),
    usedTokens: integer("used_tokens"),
  },
  (table) => {
    return {
      userIdx: index("message_user_id_ai_model_idx").on(
        table.userId,
        table.aiModel
      ),
    };
  }
);

export const messageRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));
