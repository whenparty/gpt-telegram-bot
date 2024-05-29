import { I18nFlavor } from "@grammyjs/i18n";
import { Bot, Context } from "grammy";

export type BotContext = Context & I18nFlavor;

export const bot = new Bot<BotContext>(process.env["TELEGRAM_BOT_API_TOKEN"]!, {
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
