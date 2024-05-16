import { Elysia } from "elysia";
import { testController } from "./controllers/testController";
import { botController } from "./controllers/botController";
import { db } from "db/connection";
import { Repository } from "db/repository/repository";

const repository = new Repository(db);

const app = new Elysia()
  .use(botController)
  .use(testController(repository))
  .get("/", () => "Test")
  .listen(8787);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
