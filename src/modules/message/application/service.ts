import z from "zod";
import type { MessageCache } from "../infrastructure/cache.js";
import type { MessageRepository } from "../infrastructure/repository.js";

export class MessageService {
  constructor(
    private readonly repository: MessageRepository,
    private readonly cache: MessageCache,
  ) {}

  public async handleSentUserMessage(payload: { content: string; channel: string; user: string }) {
    try {
      const sentMessageSchema = z
        .object({
          content: z.string().min(1).max(256),
          channel: z.string(),
          user: z.string(),
        })
        .transform((schema) => {
          return {
            content: schema.content,
            sender: schema.user,
            channel: schema.channel,
          };
        });

      const parsed = sentMessageSchema.parse(payload);

      const result = await this.repository.save(parsed);

      this.cache.save(result, payload.channel);

      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
