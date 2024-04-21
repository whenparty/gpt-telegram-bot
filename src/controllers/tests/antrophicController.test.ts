import { describe, expect, it } from "bun:test";
import { anthropicController } from "../anthropicController";

const TEST_HOST = "http://localhost";

describe("Elysia", () => {
  it("return a response", async () => {
    const response = await anthropicController
      .handle(new Request(`${TEST_HOST}/anthropic`))
      .then((res) => res.text());

    expect(response).toBe("Hello from Claude 3");
  });
});
