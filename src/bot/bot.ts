import { Bot } from "grammy";

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
