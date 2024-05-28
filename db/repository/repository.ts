import { ExtractTablesWithRelations, and, eq } from "drizzle-orm";
import { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { QueryFactory } from "./queryFactory";
import { AI_MODEL } from "./aiModels";
import { PgTransaction } from "drizzle-orm/pg-core";
import { IRepository, Message, Token, User, UserWithTokens } from "./types";
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
    return QueryFactory.findUserMessages(tx, userId);
  }

  async switchToModel(tx: Transaction, userId: number, aiModel: AI_MODEL) {
    await QueryFactory.setUserAiModel(tx, userId, aiModel);
    await QueryFactory.softDeleteAllMessages(tx, userId);
  }

  async saveMessages(
    tx: Transaction,
    userId: number,
    aiModel: AI_MODEL,
    messages: Pick<Message, "role" | "text">[],
    amountUsed: number
  ) {
    await QueryFactory.insertMessages(tx, userId, aiModel, messages);

    await QueryFactory.setTokenAmount(tx, {
      aiModel,
      amount: amountUsed,
      userId,
    });
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
