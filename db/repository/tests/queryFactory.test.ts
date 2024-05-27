import { it, expect, describe } from "bun:test";
import { QueryFactory } from "../queryFactory";
import { AI_MODEL } from "../aiModels";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "db/schema";

describe("Query Factory", () => {
  const db = drizzle(new Client(), { schema });

  it("getUserWithTokens", () => {
    const externalId = "user_id";
    const { sql, params } = QueryFactory.getUserWithTokens(
      db,
      externalId
    ).toSQL();

    const expectedParams = [externalId, 1];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("findAvailableAiModels", () => {
    const userId = 1;
    const { sql, params } = QueryFactory.findAvailableAiModels(
      db,
      userId
    ).toSQL();

    const expectedParams = [userId];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("insertUser", () => {
    const user = {
      aiModel: AI_MODEL.OPEN_AI_GPT_4_o,
      name: "fake",
      externalIdentifier: "fake_id",
    };

    const { sql, params } = QueryFactory.insertUser(db, user).toSQL();

    const expectedParams = [user.externalIdentifier, user.name, user.aiModel];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("insertTokens", () => {
    const userId = 1;
    const tokens = [
      {
        aiModel: AI_MODEL.CLAUDE_3_HAIKU,
        amount: 100,
      },
      {
        aiModel: AI_MODEL.CLAUDE_3_OPUS,
        amount: 200,
      },
    ];

    const { sql, params } = QueryFactory.insertTokens(
      db,
      userId,
      tokens
    ).toSQL();

    const expectedParams = [
      tokens[0].amount,
      tokens[0].aiModel,
      userId,
      tokens[1].amount,
      tokens[1].aiModel,
      userId,
    ];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  // it("updateTokenAmount", () => {
  //   const tokenId = 1;
  //   const amount = 100;

  //   const { sql, params } = queries
  //     .updateTokenAmount(db as any, tokenId, amount)
  //     .toSQL();

  //   const expectedParams = [amount, tokenId];
  //   expect(params).toStrictEqual(expectedParams);
  //   expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  // });
});

function hintFromParams(params: unknown[]) {
  return params.map((p, i) => `$${i + 1}:${p}`).join(" ");
}
