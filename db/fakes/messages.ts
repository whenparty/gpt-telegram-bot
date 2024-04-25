import { messages } from "../schema/messages";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    role: "user",
    message: "hello",
    sentAt: new Date("2024-04-25"),
    deleted: false,
    userId: 1,
  },
] as InferSelectModel<typeof messages>[];
