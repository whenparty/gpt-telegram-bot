import { ExtractTablesWithRelations, and, eq } from "drizzle-orm";
import { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { QueryFactory } from "./queryFactory";
import { AI_MODEL } from "./aiModels";
import { PgTransaction } from "drizzle-orm/pg-core";
import {
  IRepository,
  Message,
  NewMessage,
  Token,
  User,
  UserWithTokens,
} from "./types";
import * as schema from "../schema";

export type Transaction = PgTransaction<
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
  ): Promise<UserWithTokens> {
    const insertedUsers = await QueryFactory.insertUser(tx, user);
    const newUser = insertedUsers[0];

    const newTokens = await QueryFactory.insertTokens(tx, newUser.id, tokens);
    return { ...newUser, tokens: newTokens };
  }

  async createTokens(
    tx: Transaction,
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]> {
    return QueryFactory.insertTokens(tx, userId, tokens);
  }

  async findUserMessages(tx: Transaction, userId: number): Promise<Message[]> {
    return QueryFactory.findUserMessages(tx, userId);
  }

  async switchToModel(tx: Transaction, userId: number, aiModel: AI_MODEL) {
    await QueryFactory.setUserAiModel(tx, userId, aiModel);
    await QueryFactory.softDeleteAllMessages(tx, userId);
  }

  async saveMessage(tx: Transaction, message: NewMessage) {
    await QueryFactory.insertMessages(tx, [message]);

    if (message.usedTokens) {
      await QueryFactory.setTokenAmount(tx, {
        aiModel: message.aiModel,
        amount: message.usedTokens,
        userId: message.userId,
      });
    }
  }

  async softDeleteMessages(tx: Transaction, userId: number, date: Date) {
    const messagesSortedAsc = await QueryFactory.findUserMessages(tx, userId);
    const messagesSortedDesc = messagesSortedAsc.toReversed();

    let currentDate = date;
    const messagesIdToDelete = [];
    for (let message of messagesSortedDesc) {
      const diffHours =
        Math.abs(currentDate.getTime() - message.sentAt.getTime()) / 3600000;

      if (diffHours < 1) {
        currentDate = message.sentAt;
        continue;
      }

      messagesIdToDelete.push(message.id);
    }

    if (messagesIdToDelete.length) {
      await QueryFactory.softDeleteMessagesByIds(tx, messagesIdToDelete);
    }
  }
}
