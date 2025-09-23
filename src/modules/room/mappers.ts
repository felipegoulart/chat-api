import type { HydratedDocument } from "mongoose";
import type { IRoom } from "./model.js";

export function toRoomResponse(room: HydratedDocument<IRoom>) {
  return {
    id: room._id,
    name: room.name,
    description: room.description,
    code: room.code,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  };
}
