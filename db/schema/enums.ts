import { AI_MODEL } from "db/repository/aiModels";
import { pgEnum } from "drizzle-orm/pg-core";

export const aiModelEnum = pgEnum("ai_model", [
  AI_MODEL.CLAUDE_3_HAIKU,
  AI_MODEL.CLAUDE_3_OPUS,
  AI_MODEL.OPEN_AI_GPT_3_5,
  AI_MODEL.OPEN_AI_GPT_4_o,
]);
