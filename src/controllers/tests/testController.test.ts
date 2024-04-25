import { describe, expect, it, mock } from "bun:test";
import { testController } from "../testController";
import { fakeDb } from "../../../tests/preload";

const TEST_HOST = "http://localhost";

describe("Test", () => {
  it("return a response", async () => {
    const aGeneratorObject = (function* () {
      yield 1;
      yield 2;
      yield 3;
    })();
    fakeDb.from.mockReturnValue(() => [1, 2, 3]);
    const response = await testController(fakeDb)
      .handle(new Request(`${TEST_HOST}/test/`))
      .then((res) => res.text());

    expect(response).toBe("[1,2,3]");
  });
});
