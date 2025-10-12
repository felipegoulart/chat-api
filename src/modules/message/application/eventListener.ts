import type { RedisEventBus } from "../infrastructure/event-bus.js";
import type { MessageService } from "./service.js";

export class MessageEventListener {
  constructor(
    private readonly eventBus: RedisEventBus,
    private readonly service: MessageService,
  ) {}

  public async listen() {
    await this.registerMessageWebsocketListener();
  }

  private async registerMessageWebsocketListener() {
    await this.eventBus.subscribe("ws:user:message:*", async (message: string) => {
      const result = await this.service.handleSentUserMessage(JSON.parse(message));

      this.eventBus.publish("user:message:created", result);
    });
  }
}
