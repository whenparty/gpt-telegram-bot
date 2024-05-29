import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Repository, Transaction } from "../repository";
import { QueryFactory } from "../queryFactory";
import fakeUsers from "db/fakes/fakeUsers";
import fakeTokens from "db/fakes/fakeTokens";

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
    const { id: userId, ...user } = fakeUsers[0];
    const tokens = fakeTokens.slice(0, 2).map((token) => ({
      aiModel: token.aiModel,
      amount: token.amount,
    }));

    QueryFactory.insertUser = mock(() => [{ ...user, id: userId }] as any);
    QueryFactory.insertTokens = mock();

    await repository.createUser(tx, user, tokens);

    expect(QueryFactory.insertUser).toHaveBeenCalledTimes(1);
    expect(QueryFactory.insertUser).toHaveBeenCalledWith(tx, user);
    expect(QueryFactory.insertTokens).toHaveBeenCalledTimes(1);
    expect(QueryFactory.insertTokens).toHaveBeenCalledWith(tx, userId, tokens);
  });
});
