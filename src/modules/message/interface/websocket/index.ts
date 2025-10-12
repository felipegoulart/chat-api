import type { FastifyInstance } from "fastify";
import { RedisEventBus } from "@/modules/message/infrastructure/event-bus.js";
import { createRedisClient } from "@/shared/infra/redis/index.js";
import { WebSocketHandler } from "./handler.js";

export const messageWebsocket = async (app: FastifyInstance) => {
  const redis = await createRedisClient();
  const pubSub = new RedisEventBus(redis);
  const handler = new WebSocketHandler(pubSub);

  await handler.subscribe();

  app.get("/ws", { websocket: true }, handler.connectionHandler.bind(handler));
};
