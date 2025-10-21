import type { HydratedDocument } from "mongoose";
import type { IChatServer } from "./model.js";

export function toChatServerResponse(chatServer: HydratedDocument<IChatServer>) {
  return {
    id: chatServer._id,
    name: chatServer.name,
    description: chatServer.description,
    code: chatServer.code,
    createdAt: chatServer.createdAt.toISOString(),
    updatedAt: chatServer.updatedAt.toISOString(),
  };
}
