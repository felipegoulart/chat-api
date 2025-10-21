import { model, Schema, type Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  nickname: string;
  email: string;
  password: string;
  rooms: Types.ObjectId[];
  verified: {
    isVerified: boolean;
    token: string | null;
    tokenCreatedAt: Date | null;
    verifiedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    nickname: { type: String, required: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
    verified: {
      isVerified: { type: Boolean, default: false },
      token: { type: String, default: null },
      tokenCreatedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>("User", userSchema);
