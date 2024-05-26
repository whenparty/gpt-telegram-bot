import { mock } from "bun:test";
import { fakeRepository } from "db/fakes/fakeRepository";
import Elysia from "elysia";

console.log("TESTS PRELOAD");
mock.module("./src/setup.ts", () => {
  return {
    setup: new Elysia(),
    repository: fakeRepository,
  };
});
