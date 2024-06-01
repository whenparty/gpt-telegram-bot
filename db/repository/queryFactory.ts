import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../schema";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { AI_MODEL } from "./aiModels";
import { PgRelationalQuery } from "drizzle-orm/pg-core/query-builders/query";
import { Message, NewMessage, Token, User, UserWithTokens } from "./types";

export class QueryFactory {
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

  static findUserMessages(
    db: NodePgDatabase<typeof schema>,
    userId: number
  ): PgRelationalQuery<Message[]> {
    return db.query.messages.findMany({
      where: and(
        eq(schema.messages.userId, userId),
        ne(schema.messages.deleted, sql`true`)
      ),
      orderBy: asc(schema.messages.sentAt),
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

  static insertMessages(
    db: NodePgDatabase<typeof schema>,
    messages: NewMessage[]
  ) {
    return db.insert(schema.messages).values(messages);
  }

  static setUserAiModel(
    db: NodePgDatabase<typeof schema>,
    userId: number,
    aiModel: AI_MODEL
  ) {
    return db
      .update(schema.users)
      .set({
        aiModel,
      })
      .where(eq(schema.users.id, userId));
  }

  static setTokenAmount(
    db: NodePgDatabase<typeof schema>,
    usedToken: Omit<Token, "id">
  ) {
    return db
      .update(schema.tokens)
      .set({
        amount: sql`(${schema.tokens.amount}) - ${usedToken.amount}`,
      })
      .where(
        and(
          eq(schema.tokens.userId, usedToken.userId),
          eq(schema.tokens.aiModel, usedToken.aiModel)
        )
      );
  }

  static softDeleteAllMessages(
    db: NodePgDatabase<typeof schema>,
    userId: number
  ) {
    return db
      .update(schema.messages)
      .set({
        deleted: sql`true`,
      })
      .where(eq(schema.messages.userId, userId));
  }

  static softDeleteMessagesByIds(
    db: NodePgDatabase<typeof schema>,
    messageIds: number[]
  ) {
    return db
      .update(schema.messages)
      .set({
        deleted: sql`true`,
      })
      .where(inArray(schema.messages.id, messageIds));
  }
}
