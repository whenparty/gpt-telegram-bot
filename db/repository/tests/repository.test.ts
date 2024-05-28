import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Repository, Transaction } from "../repository";
import { QueryFactory } from "../queryFactory";
import { User, Token } from "../types";
import { AI_MODEL } from "../aiModels";

describe("Repository", async () => {
  const repository = new Repository();
  let tx: Transaction;

  beforeEach(() => {
    tx = mock() as unknown as Transaction;
  });

  it("calls getUserWithTokens from QueryFactory for repository.getUserWithTokens", async () => {
    QueryFactory.getUserWithTokens = mock();

    const externalIdentifier = "externalIdentifier";

    await repository.getUserWithTokens(tx, externalIdentifier);
    expect(QueryFactory.getUserWithTokens).toHaveBeenCalledTimes(1);
    expect(QueryFactory.getUserWithTokens).toHaveBeenCalledWith(
      tx,
      externalIdentifier
    );
  });

  it("calls findAvailableAiModels from QueryFactory for repository.findAvailableAiModels", async () => {
    QueryFactory.findAvailableAiModels = mock();

    const userId = 1;

    await repository.findAvailableAiModels(tx, userId);
    expect(QueryFactory.findAvailableAiModels).toHaveBeenCalledTimes(1);
    expect(QueryFactory.findAvailableAiModels).toHaveBeenCalledWith(tx, userId);
  });

  it("calls insertUser and insertTokens from QueryFactory for repository.createUser", async () => {
    const userId = 1;
    const user: Omit<User, "id"> = {
      externalIdentifier: "externalIdentifier",
      name: "name",
      aiModel: AI_MODEL.OPEN_AI_GPT_4_o,
    };

    const tokens: Pick<Token, "aiModel" | "amount">[] = [
      {
        aiModel: AI_MODEL.OPEN_AI_GPT_4_o,
        amount: 1,
      },
      {
        aiModel: AI_MODEL.CLAUDE_3_OPUS,
        amount: 2,
      },
    ];

    QueryFactory.insertUser = mock(() => [{ ...user, id: userId }] as any);
    QueryFactory.insertTokens = mock();

    await repository.createUser(tx, user, tokens);
    expect(QueryFactory.insertUser).toHaveBeenCalledTimes(1);
    expect(QueryFactory.insertUser).toHaveBeenCalledWith(tx, user);
    expect(QueryFactory.insertTokens).toHaveBeenCalledTimes(1);
    expect(QueryFactory.insertTokens).toHaveBeenCalledWith(tx, userId, tokens);
  });
});
