import { AI_MODEL } from "db/repository/aiModels";
import fakeMessages from "./fakeMessages";
import fakeUsers from "./fakeUsers";
import fakeTokens from "./fakeTokens";
import {
  IRepository,
  NewMessage,
  Token,
  User,
  UserWithTokens,
} from "db/repository/types";

export const fakeRepository: IRepository = {
  getUserWithTokens: async (externalIdentifier) => {
    return {
      ...fakeUsers[0],
      tokens: fakeTokens,
    };
  },

  findUserMessages: async () => fakeMessages,
  createUser: function (
    user: Omit<User, "id">,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<UserWithTokens> {
    throw new Error("Function not implemented.");
  },
  createTokens: function (
    userId: number,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<Token[]> {
    throw new Error("Function not implemented.");
  },
  findAvailableAiModels: function (
    userId: number
  ): Promise<Pick<Token, "aiModel" | "amount">[]> {
    throw new Error("Function not implemented.");
  },
  switchToModel: function (userId: number, aiModel: AI_MODEL): Promise<void> {
    throw new Error("Function not implemented.");
  },
  softDeleteMessages: function (userId: number, date: Date): Promise<void> {
    throw new Error("Function not implemented.");
  },
  saveMessage: function (message: NewMessage): Promise<void> {
    throw new Error("Function not implemented.");
  },
};
