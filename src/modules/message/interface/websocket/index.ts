import type { FastifyInstance } from "fastify";
import { RedisEventBus } from "@/modules/message/infrastructure/event-bus.js";
import { createRedisClient } from "@/shared/infra/redis/index.js";
import { MessageEventListener } from "../../application/eventListener.js";
import { MessageService } from "../../application/service.js";
import { MessageCache } from "../../infrastructure/cache.js";
import { MessageModel } from "../../infrastructure/model.js";
import { MessageRepository } from "../../infrastructure/repository.js";
import { WebSocketHandler } from "./handler.js";

export const messageWebsocket = async (app: FastifyInstance) => {
  const redisEventBusConnection = await createRedisClient();

  const handler = new WebSocketHandler(new RedisEventBus(redisEventBusConnection));
  await handler.subscribe();

  const messageCache = new MessageCache(await createRedisClient());
  const messageRepository = new MessageRepository(MessageModel);
  const messageService = new MessageService(messageRepository, messageCache);
  const messageEventListener = new MessageEventListener(new RedisEventBus(redisEventBusConnection), messageService);

  await messageEventListener.listen();

  app.addHook("onRequest", app.authenticate);

  app.get("/", { websocket: true }, handler.connectionHandler.bind(handler));
};
