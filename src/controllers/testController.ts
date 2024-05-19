import { Elysia } from "elysia";
import { setup } from "src/setup";

export const testController = new Elysia({ prefix: "/test" })
  .use(setup)
  .get("/", async ({ repository }) => {
    const user = await repository.getUserWithTokens("1");
    const userMessages = await repository.findUserMessages(user!);

    return userMessages;
  });
