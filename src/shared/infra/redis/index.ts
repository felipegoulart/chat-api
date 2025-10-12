import { createClient, type RedisClientOptions, type RedisClientType } from "redis";
import { env } from "@/shared/env.js";

export { RedisEventBus } from "../../../modules/message/infrastructure/event-bus.js";

export async function createRedisClient(options?: RedisClientOptions) {
  return (await createClient({ url: env.REDIS_URL, ...options }).connect()) as RedisClientType;
}

export const redis = await createRedisClient();
