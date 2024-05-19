import { InferSelectModel, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../schema/users";
import { tokens } from "../schema/tokens";
import * as schema from "../schema";
import { QueryFactory, UserWithTokens } from "./queryFactory";

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
  findUserMessages(user: User): Promise<Message[] | undefined>;
  findAvailableAiModels(
    userId: number
  ): Promise<Pick<Token, "aiModel" | "tokens">[]>;
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
        tx.rollback();
        console.error(err);
        return false;
      }
    });
  }

  async findUserMessages(user: User): Promise<Message[]> {
    return this.db.query.messages.findMany({
      where: eq(schema.messages.userId, user.id),
    });
  }

  async addMessage(userId: number, text: string) {}

  async removeMessages(userId: number, date: Date) {}
}
