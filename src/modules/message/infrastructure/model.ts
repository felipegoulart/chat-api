import { model, Schema, type Types } from "mongoose";

export interface Message {
  id: Types.ObjectId;
  sender: Types.ObjectId;
  channel: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<Message>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: Schema.Types.ObjectId, ref: "ChatChannel", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const MessageModel = model<Message>("Message", messageSchema);
