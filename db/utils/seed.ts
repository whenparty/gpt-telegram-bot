import * as schema from "../schema";
import fakeUsers from "../fakes/fakeUsers";
import fakeMessages from "../fakes/fakeMessages";
import fakeTokens from "db/fakes/fakeTokens";
import { createDB, pool } from "db/connection";

const client = await pool.connect();

const db = createDB(client);

db.transaction(async (tx) => {
  await tx.insert(schema.users).values(fakeUsers);
  await tx.insert(schema.tokens).values(fakeTokens);
  await tx.insert(schema.messages).values(fakeMessages);
});

client.release();
