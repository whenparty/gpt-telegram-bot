import {
  NodePgDatabase,
  NodePgQueryResultHKT,
} from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import { ExtractTablesWithRelations, InferSelectModel, eq } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { AI_MODEL } from "./aiModels";
import { PgRelationalQuery } from "drizzle-orm/pg-core/query-builders/query";

export type UserWithTokens = User & {
  tokens: Token[];
};

export type User = InferSelectModel<typeof schema.users>;
export type Token = InferSelectModel<typeof schema.tokens>;

export class QueryFactory {
  constructor() {}

  static getUserWithTokens(
    db: NodePgDatabase<typeof schema>,
    externalIdentifier: string
  ): PgRelationalQuery<UserWithTokens | undefined> {
    return db.query.users.findFirst({
      with: {
        tokens: true,
      },
      where: eq(schema.users.externalIdentifier, externalIdentifier),
    });
  }

  static findAvailableAiModels(
    db: NodePgDatabase<typeof schema>,
    userId: number
  ): PgRelationalQuery<{ aiModel: AI_MODEL; amount: number }[]> {
    return db.query.tokens.findMany({
      columns: {
        aiModel: true,
        amount: true,
      },
      where: eq(schema.tokens.userId, userId),
    });
  }

  static insertUser(db: NodePgDatabase<typeof schema>, user: Omit<User, "id">) {
    return db.insert(schema.users).values(user).returning();
  }

  static insertTokens(
    db: NodePgDatabase<typeof schema>,
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ) {
    return db
      .insert(schema.tokens)
      .values(
        tokens.map((token) => ({
          ...token,
          userId,
        }))
      )
      .returning();
  }

  updateTokenAmount(
    tx: PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
    id: number,
    tokensAmount: number
  ) {
    return tx
      .update(schema.tokens)
      .set({
        amount: tokensAmount,
      })
      .where(eq(schema.tokens.id, id));
  }
}
