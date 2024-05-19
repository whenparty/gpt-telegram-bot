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
  constructor(private db: NodePgDatabase<typeof schema>) {}

  getUserWithTokens(
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

  insertUser(
    tx: PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
    user: Omit<User, "id">
  ) {
    return tx
      .insert(schema.users)
      .values({
        externalIdentifier: user.externalIdentifier,
        name: user.name,
        aiModel: AI_MODEL.CLAUDE_3_HAIKU,
      })
      .returning();
  }

  insertTokens(
    tx: PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >,
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ) {
    return tx.insert(schema.tokens).values(
      tokens.map((token) => ({
        ...token,
        userId,
      }))
    );
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
        tokens: tokensAmount,
      })
      .where(eq(schema.tokens.id, id));
  }
}
