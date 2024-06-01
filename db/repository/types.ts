import { InferSelectModel } from "drizzle-orm";
import * as schema from "../schema";
import { AI_MODEL } from "./aiModels";

export type User = InferSelectModel<typeof schema.users>;
export type Token = InferSelectModel<typeof schema.tokens>;
export type Message = InferSelectModel<typeof schema.messages>;

export type NewMessage = Omit<Message, "id" | "deleted" | "sentAt">;
export type UserWithTokens = User & {
  tokens: Token[];
};

export interface IRepository {
  getUserWithTokens(
    externalIdentifier: string
  ): Promise<UserWithTokens | undefined>;
  createUser(
    user: Omit<User, "id">,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<UserWithTokens>;
  createTokens(
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]>;
  findUserMessages(userId: number): Promise<Message[]>;
  findAvailableAiModels(
    userId: number
  ): Promise<Pick<Token, "aiModel" | "amount">[]>;
  switchToModel(userId: number, aiModel: AI_MODEL): Promise<void>;
  saveMessage(message: NewMessage): Promise<void>;
  softDeleteMessages(userId: number, date: Date): Promise<void>;
}
