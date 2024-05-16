import { AI_MODEL } from "db/repository/aiModels";
import { pgEnum } from "drizzle-orm/pg-core";

export const aiModelEnum = pgEnum("ai_model", [
  AI_MODEL.CLAUDE_3_HAIKU,
  AI_MODEL.CLAUDE_3_OPUS,
]);
