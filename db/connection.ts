import { Pool, Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const client = new Client({
  connectionString: process.env.POSTGRES_URL,
});

export const db = drizzle(client);
