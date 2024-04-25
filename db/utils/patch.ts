import { client, db } from "../connection";
import { users } from "../schema/users";
import { messages } from "../schema/messages";
import fakeUsers from "../fakes/users";
import fakeMessages from "../fakes/messages";

await client.connect();
const allUsers = await db.select().from(messages);
console.log(allUsers);
console.log(allUsers[0].role === "user");
// await db.insert(users).values(fakeUsers);
// await db.insert(messages).values(fakeMessages);

client.end(console.log);
