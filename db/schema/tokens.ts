import { index, integer, pgTable, serial, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { relations } from "drizzle-orm";
import { aiModelEnum } from "./enums";

export const tokens = pgTable(
  "tokens",
  {
    id: serial("id").primaryKey(),
    amount: integer("amount").notNull(),
    aiModel: aiModelEnum("ai_model").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "restrict",
      }),
  },
  (table) => {
    return {
      userIdx: index("token_user_id_idx").on(table.userId),
      modelUserUk: unique("token_ai_model_user_id_uk").on(
        table.aiModel,
        table.userId
      ),
    };
  }
);

export const tokenRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}));
