import { Elysia } from "elysia";
import { connection } from "../../db/connection";
import { IRepository, Repository } from "../../db/repository/repository";

export const testController = (repository: IRepository) =>
  new Elysia({ prefix: "/test" }).get("/", async () => {
    //await connection.connect();

    const user = await repository.getUser(1);
    const userMessages = await repository.findUserMessages(user!);

    console.log(userMessages);

    return userMessages;
  });
