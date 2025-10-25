import { model, Schema, type Types } from "mongoose";

export interface IUser {
  _id: string;
  email: string;
  password: string;
  chatServers: string[];
  profile: {
    nickname: string;
    about?: string;
    avatarUrl?: string;
  };
  verified: {
    token: string | null;
    tokenCreatedAt: Date | null;
    verifiedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: { type: String, auto: false },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    profile: {
      nickname: { type: String, required: true, index: true },
      about: { type: String, index: true },
      avatarUrl: { type: String },
    },
    chatServers: [{ type: Schema.Types.ObjectId, ref: "ChatServer" }],
    verified: {
      token: { type: String, default: null },
      tokenCreatedAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>("User", userSchema);
