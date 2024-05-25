import { describe, expect, it } from "bun:test";
import { testController } from "../testController";

const TEST_HOST = "http://localhost";

describe("Test Controller", () => {
  it("return a response", async () => {
    const response = await testController
      .handle(new Request(`${TEST_HOST}/test/`))
      .then((res) => res.json());

    expect(response).toStrictEqual([
      {
        id: 1,
        userId: 1,
        role: "user",
        text: "hello",
        sentAt: "2024-04-25T13:21:12.000Z",
        deleted: false,
        aiModel: "claude-3-opus",
      },
      {
        id: 2,
        userId: 1,
        role: "assistant",
        text: "Hello! How can I assist you today?",
        sentAt: "2024-04-25T13:21:13.960Z",
        deleted: false,
        aiModel: "claude-3-opus",
      },
    ]);
  });
});
