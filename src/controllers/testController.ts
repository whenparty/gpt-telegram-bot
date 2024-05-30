import { Elysia } from "elysia";
import { repository, setup } from "src/setup";

export const testController = new Elysia({ prefix: "/test" })
  .use(setup)
  .get("/", async () => {
    const user = await repository.getUserWithTokens("10");
    const userMessages = await repository.findUserMessages(user!.id);

    return userMessages;
  });
