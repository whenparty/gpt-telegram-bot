import { integer, pgTable } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("tg_id").notNull().primaryKey(),
  tokens: integer("anthropic_tokens").notNull().default(0),
});
