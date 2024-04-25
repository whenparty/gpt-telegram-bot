import { Bot } from "grammy";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

export const bot = new Bot(process.env["TELEGRAM_BOT_API_TOKEN"]!, {
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
  }, 500);

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
      try {
        bot.api.editMessageText(
          message.chat.id,
          message.message_id,
          answer.join("") + " "
        );
      } catch (e) {}
      console.log("end", answer.join(""));
      const finalMessage = await messageInfo.finalMessage();
      console.log("finalMessage", finalMessage.usage);
    });
});
