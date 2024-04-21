import { Elysia } from "elysia";
import { anthropicController } from "./controllers/anthropicController";
import { botController } from "./controllers/botController";

const app = new Elysia()
  .use(botController)
  .use(anthropicController)
  .get("/", () => "Test")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
