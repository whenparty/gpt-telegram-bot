import { Bot } from "grammy";
import throttle from "lodash.throttle";
import { Message } from "@anthropic-ai/sdk/resources";
import Anthropic from "@anthropic-ai/sdk";

export class BotService {
  constructor(readonly bot: Bot, readonly anthropic: Anthropic) {}

  subscribeOnUpdate() {
    this.bot.on("message:text", async (ctx) => {
      let answer: string = "";

      const chatId = ctx.chat.id;

      const message = await this.bot.api.sendMessage(chatId, "...");
      const messageId = message.message_id;

      const typingChatActionIntervalId = await this.simulateTypingChatAction(
        chatId
      );

      const dialog = [{ role: "user" as const, content: ctx.message.text }];

      this.anthropic.messages
        .stream(
          {
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: dialog,
          },
          {
            headers: { "anthropic-version": "2023-06-01" },
          }
        )
        .on("text", async (_, text) => {
          if (text !== answer) {
            await this.throttledReplyOrEditMessageText(chatId, messageId, text);

            answer = text;
          }
        })
        .on("finalMessage", async (message: Message) => {
          const text = message.content[0]?.text ?? "";
          const tokens =
            message.usage.input_tokens + message.usage.output_tokens;

          clearInterval(typingChatActionIntervalId);
          console.log("end", text);
          console.log("tokens", tokens);
        });
    });
  }

  async simulateTypingChatAction(chatId: number) {
    try {
      await this.bot.api.sendChatAction(chatId, "typing");

      const intervalId = setInterval(async () => {
        await this.bot.api.sendChatAction(chatId, "typing");
      }, 6 * 1000);

      return intervalId;
    } catch (e) {
      console.log("simulateTypingChatAction", e);
    }
  }

  throttledReplyOrEditMessageText = throttle(this.replyOrEditMessageText, 500, {
    leading: true,
    trailing: true,
  });

  async replyOrEditMessageText(
    chatId: number,
    messageId: number,
    text: string
  ) {
    try {
      await this.bot.api.editMessageText(chatId, messageId, text);
    } catch (e) {
      console.log(e);
    }
  }
}
