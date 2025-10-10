import fp from "fastify-plugin";
import { createClient } from "redis";
import { env } from "@/env.js";

export const pubSubPlugin = fp(async (fastify) => {
  const publisher = await createClient({ url: env.REDIS_URL }).connect();
  const subscriber = await createClient({ url: env.REDIS_URL }).connect();

  fastify.decorate("redisSubscriber", subscriber);
  fastify.decorate("redisPublisher", publisher);

  fastify.addHook("onClose", (_instance, done) => {
    subscriber.close();
    publisher.close();
    done();
  });
});
