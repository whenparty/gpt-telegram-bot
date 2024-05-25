import { createDB, pool } from "db/connection";
import { Repository } from "db/repository/repository";
import { Elysia } from "elysia";

export const setup = new Elysia()
  .derive({ as: "scoped" }, async () => {
    const client = await pool.connect();
    const db = createDB(client);
    return {
      client: client,
      repository: new Repository(db),
      db: db,
    };
  })
  .onAfterHandle({ as: "scoped" }, (ctx) => {
    ctx.client?.release();
  });
