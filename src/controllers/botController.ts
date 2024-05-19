import { Elysia } from "elysia";
import { Update } from "@grammyjs/types";
import { BotService } from "../bot/botService";
import { anthropic } from "../bot/anthropic";
import { bot } from "../bot/bot";
import { setup } from "src/setup";

export const BOT_CONTROLLER_PREFIX = "/bot";
export const enum BOT_CONTROLLER_ROUTE {
  setWebhook = "/setWebhook",
  setCommands = "/setCommands",
  update = "/update",
}

export const botController = new Elysia({ prefix: BOT_CONTROLLER_PREFIX })
  .use(setup)
  .decorate("service", () => {
    const service = new BotService(bot, anthropic);
    service.subscribeOnUpdate(setup.decorator.repository);
    return service;
  })
  .get(BOT_CONTROLLER_ROUTE.setWebhook, async () => {
    try {
      return await bot.api.setWebhook(
        process.env["WEBHOOK_ORIGIN"] +
          [BOT_CONTROLLER_PREFIX, BOT_CONTROLLER_ROUTE.update].join("")
      );
    } catch (e) {
      console.error(e);
    }
  })
  .get(BOT_CONTROLLER_ROUTE.setCommands, ({ service }) => {
    try {
      service().setCommands();
    } catch (e) {
      console.error(e);
    }
  })
  .post(BOT_CONTROLLER_ROUTE.update, async ({ repository, body }) => {
    const update = body as Update;
    try {
      await bot.handleUpdate(update);
    } catch (e) {
      console.error(e);
    }

    return new Response("ok", { status: 200 });
  });
