export type OnUpdate = (text: string) => Promise<void>;
export type OnFinalMessage = (
  finalText: string,
  usedTokens: number
) => Promise<void>;

export type AIClientMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface AIClient {
  stream(params: {
    model: string;
    messages: AIClientMessage[];
    onUpdate: OnUpdate;
    onFinalMessage: OnFinalMessage;
  }): Promise<void>;
}
