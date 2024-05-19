import { AI_MODEL } from "db/repository/aiModels";
import { tokens } from "../schema/tokens";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    userId: 1,
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
    tokens: 10,
  },
] as InferSelectModel<typeof tokens>[];
