import OpenAI from "openai";
import {
  AIClient,
  AIClientMessage,
  OnFinalMessage,
  OnUpdate,
} from "./aiClient";

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
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        finalMessage += " " + text;
        await onUpdate(finalMessage);
      }

      usedTokens += chunk.usage?.total_tokens ?? 0;
    }

    await onFinalMessage(finalMessage, usedTokens);
  }
}

export const openai = new OpenAIClient();
