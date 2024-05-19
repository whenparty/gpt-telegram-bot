import { Elysia } from "elysia";
import { testController } from "./controllers/testController";
import { botController } from "./controllers/botController";
import { connection, db } from "db/connection";

await connection.connect();

export const app = new Elysia()
  .use(botController)
  .use(testController)
  .get("/", () => "Test")
  .listen(8787);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
