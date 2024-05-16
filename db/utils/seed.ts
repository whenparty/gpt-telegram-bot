import { connection, db } from "../connection";
import * as schema from "../schema";
import fakeUsers from "../fakes/fakeUsers";
import fakeMessages from "../fakes/fakeMessages";

await connection.connect();
const allUsers = await db.select().from(schema.messages);
console.log(allUsers);
console.log(allUsers[0].role === "user");
await db.insert(users).values(fakeUsers);
await db.insert(messages).values(fakeMessages);

connection.end(console.log);
