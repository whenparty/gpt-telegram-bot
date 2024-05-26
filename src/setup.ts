import { pool } from "db/connection";
import { Repository } from "db/repository/repository";
import { withTransaction } from "db/repository/repositoryDecorator";
import { Elysia } from "elysia";

export const repository = withTransaction(new Repository(), pool);

export const setup = new Elysia()
  .onBeforeHandle({ as: "scoped" }, async () => {
    console.log("onBeforeHandle", pool.idleCount, pool.totalCount);
  })
  .onAfterHandle({ as: "scoped" }, (ctx) => {
    console.log("onAfterHandle", pool.idleCount, pool.totalCount);
  });
