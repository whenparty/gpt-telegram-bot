import { Elysia } from "elysia";
import { Update } from "@grammyjs/types";
import { BotService } from "../bot/botService";
import { anthropic } from "../bot/aiClients/anthropic";
import { bot } from "../bot/bot";
import { repository, setup } from "src/setup";
import { openai } from "src/bot/aiClients/openai";
import { AI_MODEL } from "db/repository/aiModels";
import * as Sentry from "@sentry/bun";

export const BOT_CONTROLLER_PREFIX = "/bot";
export const enum BOT_CONTROLLER_ROUTE {
  setWebhook = "/setWebhook",
  setCommands = "/setCommands",
  update = "/update",
}

const aiClientsMap = {
  [AI_MODEL.CLAUDE_3_HAIKU]: anthropic,
  [AI_MODEL.CLAUDE_3_OPUS]: anthropic,
  [AI_MODEL.OPEN_AI_GPT_3_5]: openai,
  [AI_MODEL.OPEN_AI_GPT_4_o]: openai,
};

export const botController = new Elysia({ prefix: BOT_CONTROLLER_PREFIX })
  .use(setup)
  .decorate("service", new BotService(bot, aiClientsMap, repository))
  .get(BOT_CONTROLLER_ROUTE.setWebhook, async () => {
    try {
      const webhookUrl =
        process.env["WEBHOOK_ORIGIN"] +
        [BOT_CONTROLLER_PREFIX, BOT_CONTROLLER_ROUTE.update].join("");

      console.log("Webhook", webhookUrl);
      return await bot.api.setWebhook(webhookUrl);
    } catch (e) {
      Sentry.captureException(e);
    }
  })
  .get(BOT_CONTROLLER_ROUTE.setCommands, ({ service }) => {
    try {
      service.setCommands();
    } catch (e) {
      Sentry.captureException(e);
    }
  })
  .post(BOT_CONTROLLER_ROUTE.update, async ({ body }) => {
    const update = body as Update;
    try {
      await bot.handleUpdate(update);
    } catch (e) {
      Sentry.captureException(e);
    }

    return new Response("ok", { status: 200 });
  });
