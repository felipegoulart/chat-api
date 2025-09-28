import { model, Schema, type Types } from "mongoose";

export interface IMessage {
  id: Types.ObjectId;
  sender: Types.ObjectId;
  room: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const Message = model<IMessage>("Message", messageSchema);
