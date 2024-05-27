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
  ): Promise<Pick<Token, "aiModel" | "amount">[]>;
  switchToModel(userId: number, aiModel: AI_MODEL): Promise<boolean>;
  saveMessages(
    userId: number,
    aiModel: AI_MODEL,
    messages: any,
    tokensLeft: number
  ): Promise<boolean>;
  softDeleteMessages(userId: number, date: Date): Promise<boolean>;
}

type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

type RepositoryWithTx = {
  [K in keyof IRepository]: IRepository[K] extends (...args: infer A) => infer R
    ? (...args: [tx: Transaction, ...A]) => R
    : IRepository[K];
};

export class Repository implements RepositoryWithTx {
  async getUserWithTokens(
    tx: Transaction,
    externalIdentifier: string
  ): Promise<UserWithTokens | undefined> {
    return QueryFactory.getUserWithTokens(tx, externalIdentifier);
  }

  async findAvailableAiModels(
    tx: Transaction,
    userId: number
  ): Promise<Pick<Token, "aiModel" | "amount">[]> {
    return QueryFactory.findAvailableAiModels(tx, userId);
  }

  async createUser(
    tx: Transaction,
    user: Omit<User, "id">,
    tokens: { aiModel: AI_MODEL; amount: number }[]
  ): Promise<User> {
    const insertedUsers = await QueryFactory.insertUser(tx, user);
    const newUser = insertedUsers[0];

    await QueryFactory.insertTokens(tx, newUser.id, tokens);
    return newUser;
  }

  async createTokens(
    tx: Transaction,
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]> {
    return QueryFactory.insertTokens(tx, userId, tokens);
  }

  async findUserMessages(tx: Transaction, userId: number): Promise<Message[]> {
    return tx.query.messages.findMany({
      where: and(
        eq(schema.messages.userId, userId),
        ne(schema.messages.deleted, true)
      ),
      orderBy: asc(schema.messages.sentAt),
    });
  }

  async switchToModel(tx: Transaction, userId: number, aiModel: AI_MODEL) {
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
    tx: Transaction,
    userId: number,
    aiModel: AI_MODEL,
    messages: Pick<Message, "role" | "text">[],
    tokenAmount: number
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
        amount: tokenAmount,
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
    tx: Transaction,
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
