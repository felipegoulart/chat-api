import type { RedisClientType } from "redis";

export class MessageCache {
  constructor(private readonly cache: RedisClientType) {}

  public async save(payload: any, channel: string) {
    const cacheName = `chat:channel:${channel}:history`;
    await this.cache.LPUSH(cacheName, JSON.stringify(payload));
    this.handleListSize(cacheName, 100);
  }

  private async handleListSize(cacheName: string, maxSize: number) {
    if ((await this.cache.LLEN(cacheName)) >= maxSize) {
      await this.cache.LTRIM(cacheName, 0, maxSize - 1);
    }
  }
}
