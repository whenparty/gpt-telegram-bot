import { Bot, InlineKeyboard } from "grammy";
import throttle from "lodash.throttle";
import { AI_MODEL, AI_MODEL_API_VERSION } from "db/repository/aiModels";
import { AIClient } from "./aiClients/aiClient";
import { IRepository, Message, Token } from "db/repository/types";

const DEFAULT_TOKENS: Pick<Token, "aiModel" | "amount">[] = [
  {
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
    amount: 1000,
  },
];

export class BotService {
  constructor(
    readonly bot: Bot,
    readonly aiClients: Record<AI_MODEL, AIClient>,
    readonly repository: IRepository
  ) {
    this.subscribeOnUpdate();
  }

  setCommands() {
    this.bot.api.setMyCommands([
      //   { command: "selectmodel", description: "Select an AI model" },
      { command: "newchat", description: "Start a new chat" },
    ]);

    this.bot.api.setMyCommands(
      [
        //   { command: "selectmodel", description: "Выберите ИИ" },
        { command: "newchat", description: "Начать новый чат" },
      ],
      { language_code: "ru" }
    );
  }

  private subscribeOnUpdate() {
    this.bot.command("start", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      const userId = from.id.toString();
      let user = await this.repository.getUserWithTokens(userId);

      if (!user) {
        const tokens = DEFAULT_TOKENS;
        const newUser = await this.repository.createUser(
          {
            externalIdentifier: from.id.toString(),
            aiModel: AI_MODEL.CLAUDE_3_HAIKU,
            name: [from.username, from.first_name, from.last_name]
              .filter(Boolean)
              .join(" "),
          },
          DEFAULT_TOKENS
        );

        user = {
          ...newUser,
          tokens: tokens as Token[],
        };
      }

      if (!user.tokens.length) {
        await this.repository.createTokens(user.id, DEFAULT_TOKENS);
      }

      const inlineKeyboard = new InlineKeyboard();
      user.tokens.forEach((token) => {
        const modelTokens = token.amount > 1e6 ? "not limited" : token.amount;
        inlineKeyboard
          .text(`${token.aiModel} / tokens: ${modelTokens}`, token.aiModel)
          .row();
      });
      // Send the menu:
      await ctx.reply("Select the gtp model:", {
        reply_markup: inlineKeyboard,
      });
    });

    this.bot.command("newchat", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      const externalUserId = from.id.toString() ?? "";
      const user = await this.repository.getUserWithTokens(externalUserId);
      if (!user) {
        throw new Error(`There is no user with id: ${externalUserId}`);
      }

      const nextHourDate = new Date();
      nextHourDate.setHours(nextHourDate.getHours() + 2);
      await this.repository.softDeleteMessages(user.id, nextHourDate);
      await ctx.reply(`Chat history cleared`);
    });

    this.bot.on("callback_query:data", async (ctx) => {
      const selectedAiModel = ctx.callbackQuery.data as AI_MODEL;
      const externalUserId = ctx.from.id.toString();
      const user = await this.repository.getUserWithTokens(externalUserId);
      if (!user) {
        throw new Error(`There is no user with id: ${externalUserId}`);
      }

      if (user.aiModel === selectedAiModel) {
        await ctx.editMessageText(
          `The current model is already ${selectedAiModel}`,
          {
            reply_markup: undefined,
          }
        );
        return;
      }

      const availableTokens = user.tokens.find(
        (token) => token.aiModel === selectedAiModel
      );
      if (!availableTokens || availableTokens.amount <= 0) {
        await ctx.answerCallbackQuery({
          text: `Unfortunately you do not have tokens for ${selectedAiModel}. Please select another AI model.`,
        });
      }

      await this.repository.switchToModel(user.id, selectedAiModel);

      await ctx.editMessageText(
        `Select the gtp model:\nYou chose ${selectedAiModel}`,
        {
          reply_markup: undefined,
        }
      );
    });

    this.bot.on("message:text", async (ctx) => {
      const chatId = ctx.chat.id;
      const typingChatActionIntervalId = await this.simulateTypingChatAction(
        chatId
      );

      const externalUserId = ctx.from.id.toString();
      const user = await this.repository.getUserWithTokens(externalUserId);
      if (!user) {
        throw new Error(`There is no user with id: ${externalUserId}`);
      }

      const availableTokens = user.tokens.find(
        (token) => token.aiModel === user.aiModel
      );
      if (!availableTokens || availableTokens.amount <= 0) {
        await this.bot.api.sendMessage(
          chatId,
          `Unfortunately you do not have tokens for ${user.aiModel}`
        );
        return;
      }

      await this.repository.softDeleteMessages(user.id, new Date());

      let answer: string = "";

      const message = await this.bot.api.sendMessage(chatId, "...");
      const messageId = message.message_id;

      const messages = await this.repository.findUserMessages(user.id);
      const userMessage = { role: "user" as const, content: ctx.message.text };
      const dialog = [
        ...messages.map((m) => ({ role: m.role, content: m.text })),
        userMessage,
      ];

      await this.aiClients[user.aiModel].stream({
        model: AI_MODEL_API_VERSION[user.aiModel],
        messages: dialog,
        onUpdate: async (text) => {
          if (text !== answer) {
            await this.throttledReplyOrEditMessageText(chatId, messageId, text);

            answer = text;
          }
        },
        onFinalMessage: async (text, usedTokens) => {
          clearInterval(typingChatActionIntervalId);

          const askedQuestion: Pick<Message, "role" | "text"> = {
            role: "user",
            text: userMessage.content,
          };
          const assistantResponse = { role: "assistant", text };

          const tokensLeft = availableTokens.amount - usedTokens;

          const success = await this.repository.saveMessages(
            user.id,
            user.aiModel,
            [askedQuestion, assistantResponse],
            tokensLeft
          );

          console.log("end", text);
          console.log("tokens", tokensLeft);
          console.log("success", success);
        },
      });
    });
  }

  private async simulateTypingChatAction(chatId: number) {
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

  private throttledReplyOrEditMessageText = throttle(
    this.replyOrEditMessageText,
    500,
    {
      leading: true,
      trailing: true,
    }
  );

  private async replyOrEditMessageText(
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
