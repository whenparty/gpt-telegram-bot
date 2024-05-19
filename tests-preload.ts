import { mock } from "bun:test";
import { fakeRepository } from "db/fakes/fakeRepository";
import Elysia from "elysia";

console.log("TESTS PRELOASD");
mock.module("./src/setup.ts", () => {
  return {
    setup: new Elysia().decorate({
      repository: fakeRepository,
    }),
  };
});
