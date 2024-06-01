import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Repository, Transaction } from "../repository";
import { QueryFactory } from "../queryFactory";
import fakeUsers from "db/fakes/fakeUsers";
import fakeTokens from "db/fakes/fakeTokens";
import { AI_MODEL } from "../aiModels";
import fakeMessages from "db/fakes/fakeMessages";

describe("Repository", async () => {
  const repository = new Repository();
  let tx: Transaction;

  beforeEach(() => {
    tx = mock() as unknown as Transaction;
  });

  it("getUserWithTokens calls getUserWithTokens from QueryFactory", async () => {
    QueryFactory.getUserWithTokens = mock();

    const externalIdentifier = "externalIdentifier";

    await repository.getUserWithTokens(tx, externalIdentifier);
    expect(QueryFactory.getUserWithTokens).toHaveBeenCalledTimes(1);
    expect(QueryFactory.getUserWithTokens).toHaveBeenCalledWith(
      tx,
      externalIdentifier
    );
  });

  it("findAvailableAiModels calls findAvailableAiModels from QueryFactory", async () => {
    QueryFactory.findAvailableAiModels = mock();

    const userId = 1;

    await repository.findAvailableAiModels(tx, userId);
    expect(QueryFactory.findAvailableAiModels).toHaveBeenCalledTimes(1);
    expect(QueryFactory.findAvailableAiModels).toHaveBeenCalledWith(tx, userId);
  });

  it("createUser calls insertUser and insertTokens from QueryFactory", async () => {
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

  it("switchToModel calls setUserAiModel and softDeleteAllMessages from QueryFactory", async () => {
    QueryFactory.setUserAiModel = mock();
    QueryFactory.softDeleteAllMessages = mock();

    const { id: userId, aiModel } = fakeUsers[0];

    await repository.switchToModel(tx, userId, aiModel);

    expect(QueryFactory.setUserAiModel).toHaveBeenCalledTimes(1);
    expect(QueryFactory.setUserAiModel).toHaveBeenCalledWith(
      tx,
      userId,
      aiModel
    );
    expect(QueryFactory.softDeleteAllMessages).toHaveBeenCalledTimes(1);
    expect(QueryFactory.softDeleteAllMessages).toHaveBeenCalledWith(tx, userId);
  });

  it("saveMessage calls insertMessages and setTokenAmount from QueryFactory", async () => {
    const message = fakeMessages[1];

    QueryFactory.insertMessages = mock();
    QueryFactory.setTokenAmount = mock();

    await repository.saveMessage(tx, message);

    expect(QueryFactory.insertMessages).toHaveBeenCalledTimes(1);
    expect(QueryFactory.insertMessages).toHaveBeenCalledWith(tx, [message]);
    expect(QueryFactory.setTokenAmount).toHaveBeenCalledTimes(1);
    expect(QueryFactory.setTokenAmount).toHaveBeenCalledWith(tx, {
      aiModel: message.aiModel,
      amount: message.usedTokens,
      userId: message.userId,
    });
  });

  it("softDeleteMessages calls findUserMessages and softDeleteMessagesByIds from QueryFactory", async () => {
    QueryFactory.findUserMessages = mock(
      () => Promise.resolve(fakeMessages) as any
    );
    QueryFactory.softDeleteMessagesByIds = mock();

    const userId = fakeUsers[0].id;
    const date = new Date();

    await repository.softDeleteMessages(tx, userId, date);

    expect(QueryFactory.findUserMessages).toHaveBeenCalledTimes(1);
    expect(QueryFactory.findUserMessages).toHaveBeenCalledWith(tx, userId);
    expect(QueryFactory.softDeleteMessagesByIds).toHaveBeenCalledTimes(1);
    expect(QueryFactory.softDeleteMessagesByIds).toHaveBeenCalledWith(
      tx,
      [2, 1]
    );
  });
});
