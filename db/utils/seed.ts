import { connection, db } from "../connection";
import * as schema from "../schema";
import fakeUsers from "../fakes/fakeUsers";
import fakeMessages from "../fakes/fakeMessages";
import fakeTokens from "db/fakes/fakeTokens";

await connection.connect();

await db.insert(schema.users).values(fakeUsers);
await db.insert(schema.tokens).values(fakeTokens);
await db.insert(schema.messages).values(fakeMessages);

connection.end(console.log);
