import { Elysia } from "elysia";
import { users } from "../../db/schema/users";
import { client } from "../../db/connection";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export const testController = (
  database: NodePgDatabase<Record<string, never>>
) =>
  new Elysia({ prefix: "/test" }).get("/", async () => {
    await client.connect();
    const allUsers = await database.select().from(users);
    console.log(allUsers);
    return allUsers;
  });
