import { db } from "db/connection";
import { Repository } from "db/repository/repository";
import Elysia from "elysia";
import { BotService } from "./bot/botService";

export const setup = new Elysia().decorate({
  repository: new Repository(db),
});
