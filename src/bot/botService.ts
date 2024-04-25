import { Update } from "@grammyjs/types";
import { Bot } from "grammy";

export class BotService {
  constructor(private readonly bot: Bot) {}

  async setWebhook(path: string) {
    try {
      return await this.bot.api.setWebhook(
        process.env["WEBHOOK_ORIGIN"] + path
      );
    } catch (e) {
      console.error(e);
    }
  }

  async handleUpdate(update: Update) {
    try {
      await this.bot.handleUpdate(update);
    } catch (e) {
      console.error(e);
    }
  }
}
