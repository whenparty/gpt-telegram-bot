import { AI_MODEL } from "db/repository/aiModels";
import { users } from "../schema/users";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    name: "Nikolai",
    externalIdentifier: "1",
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
  },
] as InferSelectModel<typeof users>[];
