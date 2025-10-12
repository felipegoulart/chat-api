import type { Message, MessageModel } from "./model.js";

export class MessageRepository {
  constructor(private readonly model: typeof MessageModel) {}

  public async save(payload: { content: string; sender: string; channel: string }) {
    const message = new this.model({
      content: payload.content,
      channel: payload.channel,
      sender: payload.sender,
    });

    await message.save();

    return message.toJSON();
  }
}
