import OpenAI from "openai";
import { AIClient, AIClientMessage, OnFinalMessage, OnUpdate } from "./types";
import { OUTPUT_TEXT_STYLE } from "./systemMessages";

const SYSTEM_MESSAGE = {
  role: "system" as const,
  content: OUTPUT_TEXT_STYLE,
};

class OpenAIClient implements AIClient {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
    let finalMessage = "";
    let usedTokens = 0;
    const stream = await this.openai.chat.completions.create({
      model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      if (chunk.choices[0] && !chunk.choices[0].finish_reason) {
        const text = chunk.choices[0].delta.content ?? "";
        finalMessage += text;
        await onUpdate(finalMessage);
      }

      if (chunk.usage) {
        usedTokens = chunk.usage.total_tokens;
      }
    }

    await onFinalMessage(finalMessage, usedTokens);
  }
}

export const openai = new OpenAIClient();
