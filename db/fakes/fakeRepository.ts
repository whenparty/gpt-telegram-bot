import { AI_MODEL } from "db/repository/aiModels";
import { IRepository, Token } from "../repository/repository";
import fakeMessages from "./fakeMessages";
import fakeUsers from "./fakeUsers";
import fakeTokens from "./fakeTokens";

export const fakeRepository: IRepository = {
  getUserWithTokens: async (externalIdentifier) => {
    return {
      ...fakeUsers[0],
      tokens: fakeTokens,
    };
  },

  findUserMessages: async () => fakeMessages,
  createUser: function (
    user: Omit<
      {
        id: number;
        externalIdentifier: string;
        name: string;
        aiModel: AI_MODEL;
      },
      "id"
    >,
    tokens: Omit<Token, "id" | "userId">[]
  ): Promise<{
    id: number;
    externalIdentifier: string;
    name: string;
    aiModel: AI_MODEL;
  }> {
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
  switchToModel: function (
    userId: number,
    aiModel: AI_MODEL
  ): Promise<boolean> {
    throw new Error("Function not implemented.");
  },
  saveMessages: function (
    userId: number,
    aiModel: AI_MODEL,
    messages: any,
    tokensLeft: number
  ): Promise<boolean> {
    throw new Error("Function not implemented.");
  },
  softDeleteMessages: function (userId: number, date: Date): Promise<boolean> {
    throw new Error("Function not implemented.");
  },
};
