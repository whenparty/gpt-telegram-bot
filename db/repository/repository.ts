import {
  ExtractTablesWithRelations,
  InferSelectModel,
  and,
  asc,
  desc,
  eq,
  inArray,
  ne,
} from "drizzle-orm";
import { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { users } from "../schema/users";
import { tokens } from "../schema/tokens";
import * as schema from "../schema";
import { QueryFactory, UserWithTokens } from "./queryFactory";
import { AI_MODEL } from "./aiModels";
import { PgTransaction } from "drizzle-orm/pg-core";

export type User = InferSelectModel<typeof users>;
export type Token = InferSelectModel<typeof tokens>;
export type Message = InferSelectModel<(typeof schema)["messages"]>;

export interface IRepository {
  getUserWithTokens(
    externalIdentifier: string
  ): Promise<UserWithTokens | undefined>;
  createUser(
    user: Omit<User, "id">,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<User>;
  createTokens(
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]>;
  findUserMessages(userId: number): Promise<Message[]>;
  findAvailableAiModels(
    userId: number
  ): Promise<Pick<Token, "aiModel" | "tokens">[]>;
  switchToModel(userId: number, aiModel: AI_MODEL): Promise<boolean>;
  saveMessages(
    userId: number,
    aiModel: AI_MODEL,
    messages: any,
    tokensLeft: number
  ): Promise<boolean>;
  softDeleteMessages(userId: number, date: Date): Promise<boolean>;
}

type TransactionType = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type RepositoryWithTx = {
  [K in keyof IRepository]: IRepository[K] extends (...args: infer A) => infer R
    ? (...args: [tx: TransactionType, ...A]) => R
    : IRepository[K];
};

export class Repository implements RepositoryWithTx {
  private queries: QueryFactory;
  constructor() {
    this.queries = new QueryFactory();
  }

  async getUserWithTokens(
    tx: TransactionType,
    externalIdentifier: string
  ): Promise<UserWithTokens | undefined> {
    return this.queries.getUserWithTokens(tx, externalIdentifier);
  }

  async findAvailableAiModels(
    tx: TransactionType,
    userId: number
  ): Promise<Pick<Token, "aiModel" | "tokens">[]> {
    return tx
      .select({
        aiModel: schema.tokens.aiModel,
        tokens: schema.tokens.tokens,
      })
      .from(schema.tokens)
      .where(eq(schema.users.id, userId));
  }

  async createUser(
    tx: TransactionType,
    user: Omit<User, "id">,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<User> {
    const insertedUsers = await this.queries.insertUser(tx, user);
    const newUser = insertedUsers[0];

    await this.queries.insertTokens(tx, newUser.id, tokens);
    return newUser;
  }

  async createTokens(
    tx: TransactionType,
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]> {
    return this.queries.insertTokens(tx, userId, tokens).returning();
  }

  // async updateTokensAmount(
  //   tx: TransactionType,
  //   id: number,
  //   tokensAmount: number
  // ) {
  //   await this.queries.updateTokenAmount(tx, id, tokensAmount);
  // }

  async findUserMessages(
    tx: TransactionType,
    userId: number
  ): Promise<Message[]> {
    return tx.query.messages.findMany({
      where: and(
        eq(schema.messages.userId, userId),
        ne(schema.messages.deleted, true)
      ),
      orderBy: asc(schema.messages.sentAt),
    });
  }

  async switchToModel(tx: TransactionType, userId: number, aiModel: AI_MODEL) {
    // set ai model
    await tx
      .update(schema.users)
      .set({
        aiModel,
      })
      .where(eq(schema.users.id, userId));

    // soft delete old messages
    await tx
      .update(schema.messages)
      .set({
        deleted: true,
      })
      .where(eq(schema.messages.userId, userId));

    return true;
  }

  async saveMessages(
    tx: TransactionType,
    userId: number,
    aiModel: AI_MODEL,
    messages: Pick<Message, "role" | "text">[],
    tokens: number
  ) {
    await tx.insert(schema.messages).values(
      messages.map((m) => ({
        userId,
        aiModel,
        role: m.role,
        text: m.text,
      }))
    );

    await tx
      .update(schema.tokens)
      .set({
        tokens: tokens,
      })
      .where(
        and(
          eq(schema.tokens.userId, userId),
          eq(schema.tokens.aiModel, aiModel)
        )
      );

    return true;
  }

  async softDeleteMessages(
    tx: TransactionType,
    userId: number,
    date: Date
  ): Promise<boolean> {
    const messages = await tx.query.messages.findMany({
      where: and(
        eq(schema.messages.userId, userId),
        ne(schema.messages.deleted, true)
      ),
      orderBy: desc(schema.messages.sentAt),
    });

    let currentDate = date;
    const messagesIdToDelete = [];
    for (let message of messages) {
      const diffHours =
        Math.abs(currentDate.getTime() - message.sentAt.getTime()) / 3600000;
      if (diffHours < 1) {
        currentDate = message.sentAt;
        continue;
      }

      messagesIdToDelete.push(message.id);
    }
    if (messagesIdToDelete.length) {
      await tx
        .update(schema.messages)
        .set({
          deleted: true,
        })
        .where(inArray(schema.messages.id, messagesIdToDelete));
    }
    return true;
  }
}
