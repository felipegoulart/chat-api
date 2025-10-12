import type { HydratedDocument } from "mongoose";
import type { ChatChannel } from "./model.js";

export function toChatChannelResponse(channel: HydratedDocument<ChatChannel>) {
  return {
    id: channel._id,
    name: channel.name,
    description: channel.description,
    code: channel.code,
    createdAt: channel.createdAt.toISOString(),
    updatedAt: channel.updatedAt.toISOString(),
  };
}
