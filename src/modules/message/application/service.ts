import type { MessageCache } from "../infrastructure/cache.js";
import type { MessageRepository } from "../infrastructure/repository.js";

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly cache: MessageCache,
  ) {}

  public async handleSentUserMessage(payload: any) {
    const result = await this.repository.save({
      content: payload.content,
      channel: payload.channel,
      sender: payload.user,
    });

    this.cache.save(result, payload.channel);
  }
}
