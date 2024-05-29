import { Bot, InlineKeyboard } from "grammy";
import throttle from "lodash.throttle";
import {
  AI_MODEL,
  AI_MODEL_API_VERSION,
  AI_MODEL_DISPLAY_NAME,
} from "db/repository/aiModels";
import { AIClient } from "./aiClients/types";
import { IRepository, Token } from "db/repository/types";
import { BotContext } from "./bot";
import { I18n } from "@grammyjs/i18n";

const DEFAULT_TOKENS: Pick<Token, "aiModel" | "amount">[] = [
  {
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
    amount: 1000,
  },
];

export class BotService {
  constructor(
    readonly bot: Bot<BotContext>,
    readonly aiClients: Record<AI_MODEL, AIClient>,
    readonly repository: IRepository
  ) {
    this.subscribeOnUpdate();
  }

  setCommands() {
    this.bot.api.setMyCommands([
      { command: "setmodel", description: "Select an AI model" },
      { command: "newchat", description: "Start a new chat" },
    ]);

    this.bot.api.setMyCommands(
      [
        { command: "setmodel", description: "Выберите модель ИИ" },
        { command: "newchat", description: "Начать новый чат" },
      ],
      { language_code: "ru" }
    );
  }

  private subscribeOnUpdate() {
    const i18n = new I18n<BotContext>({
      defaultLocale: "en",
      directory: "src/bot/locales",
    });
    this.bot.use(i18n);
    this.bot.command("start", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      const externalUserId = from.id.toString();
      let user = await this.repository.getUserWithTokens(externalUserId);

      if (!user) {
        const tokens = DEFAULT_TOKENS;
        const newUser = await this.repository.createUser(
          {
            externalIdentifier: externalUserId,
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

      const inlineKeyboard = new InlineKeyboard();
      user.tokens.forEach((token) => {
        const tokenAmount =
          token.amount > 1e6 ? ctx.t("not-limited") : token.amount;

        const modelDisplayText = ctx.t("set-ai-model-option", {
          modelDisplayName: AI_MODEL_DISPLAY_NAME[token.aiModel],
          tokenAmount,
        });

        inlineKeyboard.text(modelDisplayText, token.aiModel).row();
      });
      // Send the menu:
      await ctx.reply(ctx.t("select-model"), {
        reply_markup: inlineKeyboard,
      });
    });

    this.bot.command("setmodel", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      const externalUserId = from.id.toString();
      const user = await this.repository.getUserWithTokens(externalUserId);
      if (!user) {
        return;
      }

      const inlineKeyboard = new InlineKeyboard();
      user.tokens.forEach((token) => {
        const tokenAmount =
          token.amount > 1e6 ? ctx.t("not-limited") : token.amount;

        const modelDisplayText = ctx.t("set-ai-model-option", {
          modelDisplayName: AI_MODEL_DISPLAY_NAME[token.aiModel],
          tokenAmount,
        });

        inlineKeyboard.text(modelDisplayText, token.aiModel).row();
      });
      // Send the menu:
      await ctx.reply(ctx.t("select-model"), {
        reply_markup: inlineKeyboard,
      });
    });

    this.bot.command("newchat", async (ctx) => {
      const { from } = ctx;
      if (!from || from.is_bot) {
        return;
      }

      const externalUserId = from.id.toString();
      const user = await this.repository.getUserWithTokens(externalUserId);
      if (!user) {
        throw new Error(`There is no user with id: ${externalUserId}`);
      }

      const nextHourDate = new Date();
      nextHourDate.setHours(nextHourDate.getHours() + 2);
      await this.repository.softDeleteMessages(user.id, nextHourDate);
      await ctx.reply(ctx.t("chat-cleared"));
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
          ctx.t("no-tokens-error", { aiModel: user.aiModel })
        );
        return;
      }

      await this.repository.softDeleteMessages(user.id, new Date());

      let answer: string = "";

      const responseMessage = await this.bot.api.sendMessage(chatId, "...");
      const responseMessageId = responseMessage.message_id;

      const savedMessages = await this.repository.findUserMessages(user.id);

      const userMessage = { role: "user" as const, text: ctx.message.text };
      const saveUserMessagePromise = this.repository.saveMessages(
        user.id,
        user.aiModel,
        [userMessage]
      );

      const dialog = [...savedMessages, userMessage].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      await this.aiClients[user.aiModel].stream({
        model: AI_MODEL_API_VERSION[user.aiModel],
        messages: dialog,
        onUpdate: async (text) => {
          if (text !== answer) {
            await this.throttledReplyOrEditMessageText(
              chatId,
              responseMessageId,
              text
            );

            answer = text;
          }
        },
        onFinalMessage: async (text, usedTokens) => {
          clearInterval(typingChatActionIntervalId);

          const assistantResponse = { role: "assistant" as const, text };

          await saveUserMessagePromise;
          await this.repository.saveMessages(
            user.id,
            user.aiModel,
            [assistantResponse],
            usedTokens
          );

          console.log("end", text);
          console.log("tokens", usedTokens);
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
