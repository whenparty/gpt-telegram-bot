import { AI_MODEL } from "db/repository/aiModels";
import { IRepository } from "../repository/repository";
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
    tokens: Omit<
      { id: number; aiModel: string; userId: number; tokens: number },
      "id" | "userId"
    >[]
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
    tokens: Omit<
      { id: number; aiModel: string; userId: number; tokens: number },
      "id" | "userId"
    >[]
  ): Promise<
    { id: number; aiModel: string; userId: number; tokens: number }[]
  > {
    throw new Error("Function not implemented.");
  },
  findAvailableAiModels: function (
    userId: number
  ): Promise<
    Pick<
      { id: number; aiModel: string; userId: number; tokens: number },
      "aiModel" | "tokens"
    >[]
  > {
    throw new Error("Function not implemented.");
  },
};
