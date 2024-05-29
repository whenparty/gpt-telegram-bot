import { AI_MODEL } from "db/repository/aiModels";
import { User } from "db/repository/types";

export default [
  {
    id: 1,
    name: "Nikolai",
    externalIdentifier: "1",
    aiModel: AI_MODEL.CLAUDE_3_HAIKU,
  },
] satisfies User[];
