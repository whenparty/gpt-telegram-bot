import { describe, expect, it } from "bun:test";
import { testController } from "../testController";
import { fakeRepository } from "../../../db/fakes/fakeRepository";

const TEST_HOST = "http://localhost";

describe("Test Controller", () => {
  it("return a response", async () => {
    const response = await testController(fakeRepository)
      .handle(new Request(`${TEST_HOST}/test/`))
      .then((res) => res.text());

    expect(response).toBe("");
  });
});
