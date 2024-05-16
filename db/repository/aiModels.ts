export const enum AI_MODEL {
  CLAUDE_3_HAIKU = "claude-3-haiku",
  CLAUDE_3_OPUS = "claude-3-opus",
}

export const AI_MODEL_API_VERSION = {
  [AI_MODEL.CLAUDE_3_HAIKU]: "claude-3-haiku-20240307",
  [AI_MODEL.CLAUDE_3_OPUS]: "claude-3-opus-20240229",
};
