import { relations } from "drizzle-orm";
import { index, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { tokens } from "./tokens";
import { messages } from "./messages";
import { aiModelEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    externalIdentifier: varchar("external_identifier", { length: 300 })
      .notNull()
      .unique(),
    name: varchar("name", { length: 300 }).notNull(),
    aiModel: aiModelEnum("ai_model").notNull(),
  },

  (table) => {
    return {
      externalIdentifierIdx: index("external_identifier_idx").on(
        table.externalIdentifier
      ),
    };
  }
);

export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  tokens: many(tokens),
}));
