import type { Message, MessageModel } from "./model.js";

export class MessageRepository {
  constructor(private readonly model: typeof MessageModel) {}

  public async save(payload: Pick<Message, "content" | "channel" | "sender">) {
    const message = new this.model({
      content: payload.content,
      channel: payload.channel,
      sender: payload.sender,
    });

    await message.save();

    return message.toJSON();
  }
}
