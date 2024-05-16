import { users } from "../schema/users";
import { type InferSelectModel } from "drizzle-orm";

export default [
  {
    id: 1,
    tokens: 10,
  },
] as InferSelectModel<typeof users>[];
