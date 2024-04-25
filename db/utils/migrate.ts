import { client, db } from "../connection";
import { migrate } from "drizzle-orm/node-postgres/migrator";

await client.connect();
await migrate(db, { migrationsFolder: "./db/migrations" });
client.end(console.log);
