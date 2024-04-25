import { Elysia } from "elysia";
import { Update } from "@grammyjs/types";
import { BotService } from "./botService";
import { bot } from "./bot";

const botService = new BotService(bot);

export const botController = new Elysia({ prefix: "/bot" })
  .get("/setWebhook", async () => {
    return botService.setWebhook("/bot/update");
  })
  .post("/update", async (request) => {
    const update = request.body as Update;
    await botService.handleUpdate(update);

    return new Response("ok", { status: 200 });
  });
