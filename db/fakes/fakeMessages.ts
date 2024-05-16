import { AI_MODEL } from "db/repository/aiModels";
import { messages } from "../schema/messages";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    role: "user",
    text: "hello",
    sentAt: new Date("2024-04-25"),
    deleted: false,
    userId: 1,
    aiModel: AI_MODEL.CLAUDE_3_OPUS,
  },
] satisfies InferSelectModel<typeof messages>[];
