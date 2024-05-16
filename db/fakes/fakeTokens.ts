import { AI_MODEL } from "../repository/repository";
import { tokens } from "../schema/tokens";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    tokens: 10,
    userId: 1,
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
  },
] as InferSelectModel<typeof tokens>[];
