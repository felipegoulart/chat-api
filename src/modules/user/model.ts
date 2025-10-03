import { model, Schema, type Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  nickname: string;
  email: string;
  password: string;
  rooms: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    nickname: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  },
  { timestamps: true },
);

export const User = model<IUser>("User", userSchema);
