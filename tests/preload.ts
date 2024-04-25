import { mock } from "bun:test";

export const fakeDb = {
  select: mock(() => {
    return fakeDb;
  }),
  from: mock(() => {
    return fakeDb;
  }),
  values: mock(() => {
    return fakeDb;
  }),
};

// mock.module("../db/connection", () => {
//   console.log("here");
//   return {
//     client: {
//       connect() {},
//       end() {},
//     },
//     db: fakeDb,
//   };
// });

/*
import Database from "bun:sqlite";
import { mock } from "bun:test";
import { drizzle } from "drizzle-orm/better-sqlite3";

mock.module("../db/connection", async () => {
  const sqlite = new Database(":memory:");

  return {
    client: {
      connect() {},
      end() {
        sqlite.close(false);
      },
    },
    db: drizzle(sqlite),
  };
});
*/
