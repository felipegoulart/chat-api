import type { RedisArgument, RedisClientType } from "redis";

export class RedisEventBus {
  constructor(private readonly redis: RedisClientType) {}

  public async publish<T>(channel: RedisArgument, payload: T) {
    await this.redis.PUBLISH(channel, JSON.stringify(payload));
  }

  public async subscribe<T>(channel: string, callback: (message: T) => void) {
    const subConnection = this.redis.duplicate();
    await subConnection.connect();
    await subConnection.PSUBSCRIBE(channel, (message) => callback(JSON.parse(message)));
  }
}
