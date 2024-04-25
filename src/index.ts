import { Elysia } from "elysia";
import { testController } from "./controllers/testController";
import { botController } from "./bot/botController";
import { db } from "../db/connection";

const app = new Elysia()
  .use(botController)
  .use(testController(db))
  .get("/", () => "Test")
  .listen(8787);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
