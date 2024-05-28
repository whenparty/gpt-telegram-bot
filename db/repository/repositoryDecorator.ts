import { Pool } from "pg";
import { Repository } from "./repository";
import { createDB } from "db/connection";
import { IRepository } from "./types";

export const withTransaction = (
  repository: Repository,
  pool: Pool
): IRepository =>
  new Proxy(repository, {
    get(target: any, prop: keyof IRepository) {
      if (prop in target) {
        const originalMethod = target[prop];
        return async (...args: any[]) => {
          const client = await pool.connect();
          try {
            const db = createDB(client);
            return db.transaction(async (tx) => {
              return originalMethod.apply(target, [tx, ...args]);
            });
          } finally {
            client.release();
          }
        };
      }
    },
  });
