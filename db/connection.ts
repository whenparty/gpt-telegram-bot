import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const client = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export const db = drizzle(client);
