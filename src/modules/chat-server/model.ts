import { model, Schema, type Types } from "mongoose";

export interface IChatServer {
  _id: Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  adminId: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const chatServerSchema = new Schema<IChatServer>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const ChatServer = model<IChatServer>("ChatServer", chatServerSchema);
