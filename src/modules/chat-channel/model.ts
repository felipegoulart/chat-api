import { model, Schema, type Types } from "mongoose";

export interface ChatChannel {
  _id: Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  adminId: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<ChatChannel>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const ChatChannelModel = model<ChatChannel>("ChatChannel", channelSchema);
