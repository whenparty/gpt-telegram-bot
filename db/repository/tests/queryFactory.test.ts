import { it, expect, describe } from "bun:test";
import { QueryFactory } from "../queryFactory";
import { AI_MODEL } from "../aiModels";
import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "db/schema";
import { Message, Token } from "../types";

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

  it("findUserMessages", () => {
    const userId = 1;

    const { sql, params } = QueryFactory.findUserMessages(db, userId).toSQL();

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

  it("insertMessages", () => {
    const userId = 1;
    const aiModel = AI_MODEL.OPEN_AI_GPT_4_o;
    const messages: Pick<Message, "role" | "text">[] = [
      {
        role: "user",
        text: "Hi, how are you?",
      },
      {
        role: "assistant",
        text: "Hello! I am doing well.",
      },
    ];

    const { sql, params } = QueryFactory.insertMessages(
      db,
      userId,
      aiModel,
      messages
    ).toSQL();

    const expectedParams = [
      messages[0].role,
      messages[0].text,
      userId,
      aiModel,
      messages[1].role,
      messages[1].text,
      userId,
      aiModel,
    ];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("setUserAiModel", () => {
    const userId = 1;
    const aiModel = AI_MODEL.OPEN_AI_GPT_4_o;

    const { sql, params } = QueryFactory.setUserAiModel(
      db,
      userId,
      aiModel
    ).toSQL();

    const expectedParams = [aiModel, userId];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("setTokenAmount", () => {
    const token: Omit<Token, "id"> = {
      aiModel: AI_MODEL.OPEN_AI_GPT_4_o,
      amount: 100,
      userId: 1,
    };

    const { sql, params } = QueryFactory.setTokenAmount(db, token).toSQL();

    const expectedParams = [token.amount, token.userId, token.aiModel];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("softDeleteAllMessages", () => {
    const userId = 1;

    const { sql, params } = QueryFactory.softDeleteAllMessages(
      db,
      userId
    ).toSQL();

    const expectedParams = [userId];
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });

  it("softDeleteMessagesByIds", () => {
    const messagesIds = [1, 2, 3];

    const { sql, params } = QueryFactory.softDeleteMessagesByIds(
      db,
      messagesIds
    ).toSQL();

    const expectedParams = messagesIds;
    expect(params).toStrictEqual(expectedParams);
    expect(sql).toMatchSnapshot(hintFromParams(expectedParams));
  });
});

function hintFromParams(params: unknown[]) {
  return params.map((p, i) => `$${i + 1}:${p}`).join(" ");
}
