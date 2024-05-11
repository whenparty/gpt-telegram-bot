import { Bot } from "grammy";
import throttle from "lodash.throttle";
import { Message } from "@anthropic-ai/sdk/resources";
import Anthropic from "@anthropic-ai/sdk";
import { Menu } from "@grammyjs/menu";

export class BotService {
  constructor(readonly bot: Bot, readonly anthropic: Anthropic) {}

  setMenu() {
    this.bot.api.setMyCommands([
      { command: "start", description: "Select model" },
      { command: "help", description: "طلب مساعدة " },
      { command: "list", description: "القائمة " },
    ]);
    // Creating a simple menu
    const menu = new Menu("gtp-model")
      .text("Claude 3 Haiku", (ctx) => {
        ctx.reply("You selected *Claude 3 Haiku*\\!", {
          parse_mode: "MarkdownV2",
        });
        ctx.menu.close();
      })
      .row()
      .text("Claude 3 Opus", (ctx) => {
        ctx.reply("You selected *Claude 3 Opus*\\!", {
          parse_mode: "MarkdownV2",
        });
        ctx.menu.close();
      });

    // Make it interactive
    this.bot.use(menu);

    this.bot.command("start", async (ctx) => {
      console.log("start");

      // Send the menu:
      await ctx.reply("Select the gtp model:", {
        reply_markup: menu,
      });
    });
    this.bot.on("msg::bot_command", (ctx) => {
      console.log(
        "command",
        ctx.entities().filter((e) => e.type === "bot_command")[0]
      );
      ctx.react("❤‍🔥");
    });
  }

  subscribeOnUpdate() {
    this.bot.on("message:text", async (ctx) => {
      console.log("message");

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
