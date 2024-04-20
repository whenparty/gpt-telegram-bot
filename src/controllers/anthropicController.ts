import { Elysia } from "elysia";

export const anthropicController = new Elysia({ prefix: "/anthropic" }).get(
  "/",
  () => "Hello from Claude 3"
);
