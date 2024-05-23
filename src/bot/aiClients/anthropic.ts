import Anthropic from "@anthropic-ai/sdk";
import {
  AIClient,
  AIClientMessage,
  OnFinalMessage,
  OnUpdate,
} from "./aiClient";
import { AI_MODEL, AI_MODEL_API_VERSION } from "db/repository/aiModels";
import { Message } from "@anthropic-ai/sdk/resources";

class AnthropicClient implements AIClient {
  private anthropic: Anthropic;

  type: AI_MODEL;

  constructor() {
    this.type = AI_MODEL.CLAUDE_3_HAIKU;

    this.anthropic = new Anthropic({
      apiKey: process.env["ANTHROPIC_API_KEY"],
    });
  }

  async stream({
    model,
    messages,
    onUpdate,
    onFinalMessage,
  }: {
    model: string;
    messages: AIClientMessage[];
    onUpdate: OnUpdate;
    onFinalMessage: OnFinalMessage;
  }): Promise<void> {
    this.anthropic.messages
      .stream({
        model,
        messages,
        max_tokens: 1024,
      })
      .on("text", async (_, text) => {
        onUpdate(text);
      })
      .on("finalMessage", async (message: Message) => {
        const text = message.content[0]?.text ?? "";
        const tokens = message.usage.input_tokens + message.usage.output_tokens;

        onFinalMessage(text, tokens);
      });
  }
}
export const anthropic = new AnthropicClient();
