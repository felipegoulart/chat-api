import fp from "fastify-plugin";
import type { RedisClientType } from "redis";
import { env } from "@/env.js";
import { createRedisClient } from "@/infra/cache/redis.js";

export const redisPlugin = fp(async (fastify) => {
  const subscriber = await createRedisClient({ url: env.REDIS_URL });
  const publisher = await createRedisClient({ url: env.REDIS_URL });
  const cache = await createRedisClient({ url: env.REDIS_URL });

  fastify.decorate("redisSubscriber", subscriber);
  fastify.decorate("redisPublisher", publisher);
  fastify.decorate("redisCache", cache);
  fastify.decorateRequest("redisCache", { getter: () => cache });

  fastify.addHook("onClose", (_instance, done) => {
    subscriber.close();
    publisher.close();
    cache.close();
    done();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    redisSubscriber: RedisClientType;
    redisPublisher: RedisClientType;
    redisCache: RedisClientType;
  }

  interface FastifyRequest {
    redisSubscriber: RedisClientType;
    redisPublisher: RedisClientType;
    redisCache: RedisClientType;
  }
}
