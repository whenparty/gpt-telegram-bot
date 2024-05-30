import { Elysia } from "elysia";
import { testController } from "./controllers/testController";
import { botController } from "./controllers/botController";
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

export const app = new Elysia()
  .onError(({ error }) => {
    Sentry.captureException(error);
    return new Response(error.toString());
  })
  .use(botController)
  .use(testController)
  .get("/", () => "Test")
  .listen(8787);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
