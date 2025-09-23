import { model, Schema, type Types } from "mongoose";
import { codec } from "zod";

export interface IRoom {
  _id: Types.ObjectId;
  code: string;
  name: string;
  description?: string;
  // adminId: Types.ObjectId;
  // members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    // adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export const Room = model<IRoom>("Room", roomSchema);
