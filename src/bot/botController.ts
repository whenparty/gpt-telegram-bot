import { Elysia } from "elysia";
import { Update } from "@grammyjs/types";
import { BotService } from "./botService";
import { anthropic } from "./anthropic";
import { bot } from "./bot";

const botService = new BotService(bot, anthropic);

export const botController = new Elysia({ prefix: "/bot" })
  .get("/setWebhook", async () => {
    try {
      return await bot.api.setWebhook(
        process.env["WEBHOOK_ORIGIN"] + "/bot/update"
      );
    } catch (e) {
      console.error(e);
    }
  })
  .post("/update", async (request) => {
    botService.subscribeOnUpdate();

    const update = request.body as Update;
    try {
      await bot.handleUpdate(update);
    } catch (e) {
      console.error(e);
    }

    return new Response("ok", { status: 200 });
  });
