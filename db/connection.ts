import { Pool, PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // max: 3,
  // idleTimeoutMillis: 1000000,
  log: console.log,
});

export const createDB = (client: PoolClient) => drizzle(client, { schema });
