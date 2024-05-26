import { it, expect, describe } from "bun:test";
import { QueryFactory } from "../queryFactory";
import { AI_MODEL } from "../aiModels";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "db/schema";

describe("Query Factory", () => {
  const db = drizzle(new Client(), { schema });
  const queries = new QueryFactory();

  it("getUser", () => {
    const id = "user_id";
    const { sql, params } = queries.getUserWithTokens(db, id).toSQL();

    const expectedParams = [id, 1];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("insertUser", () => {
    const user = {
      aiModel: AI_MODEL.CLAUDE_3_HAIKU,
      name: "fake",
      externalIdentifier: "fake_id",
    };

    const { sql, params } = queries.insertUser(db as any, user).toSQL();

    const expectedParams = [user.externalIdentifier, user.name, user.aiModel];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("insertTokens", () => {
    const userId = 1;
    const tokens = [
      {
        aiModel: AI_MODEL.CLAUDE_3_HAIKU,
        tokens: 100,
      },
      {
        aiModel: AI_MODEL.CLAUDE_3_OPUS,
        tokens: 200,
      },
    ];

    const { sql, params } = queries
      .insertTokens(db as any, userId, tokens)
      .toSQL();

    const expectedParams = [
      tokens[0].tokens,
      tokens[0].aiModel,
      userId,
      tokens[1].tokens,
      tokens[1].aiModel,
      userId,
    ];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("updateTokenAmount", () => {
    const tokenId = 1;
    const amount = 100;

    const { sql, params } = queries
      .updateTokenAmount(db as any, tokenId, amount)
      .toSQL();

    const expectedParams = [amount, tokenId];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });
});

function hintFromParams(params: unknown[]) {
  return params.map((p, i) => `$${i + 1}:${p}`).join(" ");
}
