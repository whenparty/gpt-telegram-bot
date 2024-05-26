import { beforeAll, describe, expect, it, spyOn } from "bun:test";
import { botController } from "../botController";
import { bot } from "src/bot/bot";

const TEST_HOST = "http://localhost";

describe("Bot Controller", () => {
  let outgoingRequests = [];
  beforeAll(() => {
    bot.api.config.use((_, method, payload, signal) => {
      outgoingRequests.push({ method, payload, signal });
      return { ok: true, result: true } as any;
    });
  });

  it("sets a webhook", async () => {
    const spy = spyOn(bot.api, "setWebhook");

    const response = await botController.handle(
      new Request(`${TEST_HOST}/bot/setWebhook`)
    );

    expect(spy).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
