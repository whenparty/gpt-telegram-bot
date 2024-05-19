import { Bot, InlineKeyboard } from "grammy";
import throttle from "lodash.throttle";
import { Message } from "@anthropic-ai/sdk/resources";
import Anthropic from "@anthropic-ai/sdk";
import { IRepository, Token } from "db/repository/repository";
import { AI_MODEL, AI_MODEL_API_VERSION } from "db/repository/aiModels";

const DEFAULT_TOKENS = [
  {
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
    tokens: 1000,
  },
];

export class BotService {
  constructor(readonly bot: Bot, readonly anthropic: Anthropic) {}

  setCommands() {
    this.bot.api.setMyCommands([
      { command: "selectmodel", description: "Select an AI model" },
      { command: "newchat", description: "Start a new chat" },
    ]);

    this.bot.api.setMyCommands(
      [
        { command: "selectmodel", description: "Выберите ИИ" },
        { command: "newchat", description: "Начать новый чат" },
      ],
      { language_code: "ru" }
    );

    // const selectAiModelMenu = new Menu("dynamic");
    // selectAiModelMenu
    //   .dynamic(async () => {
    //     //const t = repository.getUser(ctx);
    //     const range = new MenuRange();
    //     const aiModels = Object.keys(AI_MODEL_API_VERSION) as AI_MODEL[];
    //     aiModels.forEach((aiModel, i) => {
    //       range
    //         .text(aiModel, (ctx) => {
    //           ctx.menu.close();
    //           ctx.reply(`You chose ${aiModel}`);
    //         })
    //         .row();
    //     });

    //     return range;
    //   })
    //   .text("Cancel", (ctx) => ctx.deleteMessage());

    // // Make it interactive
    // this.bot.use(selectAiModelMenu);
  }

  subscribeOnUpdate(repository: IRepository) {
    this.bot.command("start", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      let user = await repository.getUserWithTokens(from.id.toString());

      if (!user) {
        const tokens = DEFAULT_TOKENS;
        const newUser = await repository.createUser(
          {
            externalIdentifier: from.id.toString(),
            aiModel: AI_MODEL.CLAUDE_3_HAIKU,
            name:
              from.username ??
              [from.first_name, from.last_name].filter(Boolean).join(" "),
          },
          DEFAULT_TOKENS
        );

        user = {
          ...newUser,
          tokens: tokens as Token[],
        };
      }

      if (!user.tokens.length) {
        await repository.createTokens(user.id, DEFAULT_TOKENS);
      }

      const inlineKeyboard = new InlineKeyboard();
      user.tokens.forEach((token) => {
        inlineKeyboard
          .text(`${token.aiModel} / tokens: ${token.tokens}`, token.aiModel)
          .row();
      });
      // Send the menu:
      await ctx.reply("Select the gtp model:", {
        reply_markup: inlineKeyboard,
      });
    });

    this.bot.on("callback_query:data", async (ctx) => {
      const selectedAiModel = ctx.callbackQuery.data as AI_MODEL;
      await ctx.answerCallbackQuery({
        text: `You chose ${selectedAiModel}`,
      });
    });

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
