import { Elysia } from "elysia";
import { anthropicController } from "./controllers/anthropicController";

const app = new Elysia().use(anthropicController).listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
