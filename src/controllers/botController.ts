import Anthropic from "@anthropic-ai/sdk";
import { Elysia } from "elysia";
import { Bot } from "grammy";
import { Update } from "@grammyjs/types";

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

const bot = new Bot(process.env["TELEGRAM_BOT_API_TOKEN"]!, {
  botInfo: {
    id: 7018007874,
    is_bot: true,
    first_name: "WhenPartyGPT",
    username: "WhenPartyGptBot",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business: false,
  },
});

bot.on("message:text", async (ctx) => {
  console.log("here");

  const message = await ctx.reply("Thinking...");
  await ctx.replyWithChatAction("typing");

  const id = setInterval(async () => {
    try {
      await bot.api.editMessageText(
        message.chat.id,
        message.message_id,
        answer.join("")
      );
    } catch (e) {}
  }, 200);

  const answer: string[] = [];
  const messageInfo = anthropic.messages
    .stream({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: ctx.message.text }],
    })
    .on("text", async (text) => {
      answer.push(text);
    })
    .on("end", async () => {
      clearInterval(id);
      bot.api.editMessageText(
        message.chat.id,
        message.message_id,
        answer.join("") + " "
      );
      console.log("end", answer.join(""));
      const finalMessage = await messageInfo.finalMessage();
      console.log("finalMessage", finalMessage.usage);
    });
});

export const botController = new Elysia({ prefix: "/bot" })
  .get("/setWebhook", async () => {
    let res = undefined;
    try {
      res = await bot.api.setWebhook(
        process.env["WEBHOOK_ORIGIN"] + "/bot/update"
      );
    } catch (e) {
      console.log(e);
    }
    return res;
  })
  .post("/update", async (request) => {
    try {
      const update = request.body as Update;
      await bot.handleUpdate(update);
    } catch (e) {
      console.error(e);
    }

    return new Response("ok", { status: 200 });
  });
