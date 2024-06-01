import { AI_MODEL } from "db/repository/aiModels";
import { messages } from "../schema/messages";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    userId: 1,
    role: "user",
    text: "hello",
    sentAt: new Date("2024-04-25T13:21:12.000Z"),
    deleted: false,
    aiModel: AI_MODEL.CLAUDE_3_OPUS,
    usedTokens: null,
  },
  {
    id: 2,
    userId: 1,
    role: "assistant",
    text: "Hello! How can I assist you today?",
    sentAt: new Date("2024-04-25T13:21:13.960Z"),
    deleted: false,
    aiModel: AI_MODEL.CLAUDE_3_OPUS,
    usedTokens: 25,
  },
] satisfies InferSelectModel<typeof messages>[];
