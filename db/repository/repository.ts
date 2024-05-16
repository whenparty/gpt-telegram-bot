import { InferSelectModel, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { users } from "../schema/users";
import { tokens } from "../schema/tokens";
import * as schema from "../schema";
import { QueryFactory } from "./queryFactory";

export type User = InferSelectModel<typeof users>;
export type Token = InferSelectModel<typeof tokens>;

export interface IRepository {
  getUser(id: number): Promise<User | undefined>;
  findUserMessages(user: User): Promise<void>;
}
export class Repository implements IRepository {
  private queries: QueryFactory;
  constructor(private db: NodePgDatabase<typeof schema>) {
    this.queries = new QueryFactory(db);
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await this.queries.getUser(this.db, id);

      return user;
    } catch (err) {
      console.log(err);
    }
  }

  async findAvailableAiModels(
    userId: number
  ): Promise<Pick<Token, "aiModel" | "tokens">[] | undefined> {
    try {
      const tokens = await this.db
        .select({
          aiModel: tokens.aiModel,
          tokens: tokens.tokens,
        })
        .from(tokens)
        .where(eq(schema.users.id, userId));

      return tokens;
    } catch (err) {
      console.log(err);
    }
  }

  async createUser(
    user: Omit<User, "id">,
    tokens: Omit<Token, "userId">
  ): Promise<User | undefined> {
    return this.db.transaction(async (tx) => {
      try {
        const insertedUsers = await this.queries.insertUser(tx, user);
        const newUser = insertedUsers[0];

        await this.queries.insertTokens(tx, newUser.id, [tokens]);

        return newUser;
      } catch (err) {
        tx.rollback();
        console.error(err);
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

  async findUserMessages(user: User) {}

  async addMessage(userId: number, text: string) {}

  async removeMessages(userId: number, date: Date) {}
}
