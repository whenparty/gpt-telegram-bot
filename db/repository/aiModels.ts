export const enum AI_MODEL {
  CLAUDE_3_HAIKU = "claude-3-haiku",
  CLAUDE_3_OPUS = "claude-3-opus",
  OPEN_AI_GPT_3_5 = "openai-gpt-3.5-turbo",
  OPEN_AI_GPT_4_o = "openai-gpt-4o",
}

export const AI_MODEL_API_VERSION = {
  [AI_MODEL.CLAUDE_3_HAIKU]: "claude-3-haiku-20240307",
  [AI_MODEL.CLAUDE_3_OPUS]: "claude-3-opus-20240229",
  [AI_MODEL.OPEN_AI_GPT_3_5]: "gpt-3.5-turbo",
  [AI_MODEL.OPEN_AI_GPT_4_o]: "gpt-4o",
};

export const AI_MODEL_DISPLAY_NAME = {
  [AI_MODEL.CLAUDE_3_HAIKU]: "Claude 3 Haiku",
  [AI_MODEL.CLAUDE_3_OPUS]: "Claude 3 Opus",
  [AI_MODEL.OPEN_AI_GPT_3_5]: "Chat GPT 3.5-turbo",
  [AI_MODEL.OPEN_AI_GPT_4_o]: "Chat GPT 4o",
};
