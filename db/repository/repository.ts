import { InferSelectModel, and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../schema/users";
import { tokens } from "../schema/tokens";
import * as schema from "../schema";
import { QueryFactory, UserWithTokens } from "./queryFactory";
import { AI_MODEL } from "./aiModels";

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
export class Repository implements IRepository {
  private queries: QueryFactory;
  constructor(private db: NodePgDatabase<typeof schema>) {
    this.queries = new QueryFactory(db);
  }

  async getUserWithTokens(
    externalIdentifier: string
  ): Promise<UserWithTokens | undefined> {
    try {
      const user = await this.queries.getUserWithTokens(
        this.db,
        externalIdentifier
      );

      return user;
    } catch (err) {
      console.log(err);
    }
  }

  async findAvailableAiModels(
    userId: number
  ): Promise<Pick<Token, "aiModel" | "tokens">[]> {
    try {
      const tokens = await this.db
        .select({
          aiModel: schema.tokens.aiModel,
          tokens: schema.tokens.tokens,
        })
        .from(schema.tokens)
        .where(eq(schema.users.id, userId));

      return tokens;
    } catch (err) {
      console.log(err);
      throw new Error(`Cannot find available tokens user ${userId}`);
    }
  }

  async createUser(
    user: Omit<User, "id">,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<User> {
    return this.db.transaction(async (tx) => {
      try {
        const insertedUsers = await this.queries.insertUser(tx, user);
        const newUser = insertedUsers[0];

        await this.queries.insertTokens(tx, newUser.id, tokens);

        return newUser;
      } catch (err) {
        tx.rollback();
        console.error(err);
        throw new Error("Cannot create a new user");
      }
    });
  }

  async createTokens(
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]> {
    return this.db.transaction(async (tx) => {
      try {
        return await this.queries.insertTokens(tx, userId, tokens).returning();
      } catch (err) {
        tx.rollback();
        console.error(err);
        throw new Error(`Cannot insert tokens for user ${userId}`);
      }
    });
  }

  async updateTokensAmount(id: number, tokensAmount: number) {
    return this.db.transaction(async (tx) => {
      try {
        await this.queries.updateTokenAmount(tx, id, tokensAmount);

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    });
  }

  async findUserMessages(userId: number): Promise<Message[]> {
    return this.db.query.messages.findMany({
      where: and(
        eq(schema.messages.userId, userId),
        ne(schema.messages.deleted, true)
      ),
      orderBy: asc(schema.messages.sentAt),
    });
  }

  async switchToModel(userId: number, aiModel: AI_MODEL) {
    return this.db.transaction(async (tx) => {
      try {
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
      } catch (error) {
        console.log(error);
        return false;
      }
    });
  }

  async saveMessages(
    userId: number,
    aiModel: AI_MODEL,
    messages: Pick<Message, "role" | "text">[],
    tokens: number
  ) {
    return this.db.transaction(async (tx) => {
      try {
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
      } catch (error) {
        console.log(error);
        return false;
      }
    });
  }

  async softDeleteMessages(userId: number, date: Date): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      try {
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
            Math.abs(currentDate.getTime() - message.sentAt.getTime()) /
            3600000;
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
      } catch (err) {
        console.log(err);
        return false;
      }
    });
  }
}
