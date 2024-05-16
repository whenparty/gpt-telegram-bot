import { IRepository } from "../repository/repository";

export const fakeRepository: IRepository = {
  getUser: async () => undefined,
  findUserMessages: async () => {},
};
