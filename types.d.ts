declare module "bun" {
  interface Env {
    POSTGRES_URL: string;
    SENTRY_DSN: string;
    TELEGRAM_BOT_API_TOKEN: string;
    ANTHROPIC_API_KEY: string;
    OPENAI_API_KEY: string;
    WEBHOOK_ORIGIN: string;
  }
}
