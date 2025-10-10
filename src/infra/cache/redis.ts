import { createClient, type RedisClientOptions, type RedisClientType } from "redis";

export const createRedisClient = async (options: RedisClientOptions): Promise<RedisClientType> => {
  return (await createClient(options).connect()) as RedisClientType;
};
