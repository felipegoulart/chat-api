import type { HydratedDocument, Model } from "mongoose";
import { User } from "../entities/user.js";
import type { UserRepository } from "./repository.js";
import type { IUser } from "./user-model.js";

export class UserMongooseRepository implements UserRepository {
  constructor(private readonly model: Model<IUser>) {}

  public async create(payload: User): Promise<User> {
    const { email, id, profile, password, verificationToken, verificationTokenCreatedAt } = payload.toJSON({
      includesPassword: true,
    });

    const result = await this.model.create({
      _id: id,
      email,
      password,
      profile,
      verified: {
        token: verificationToken,
        tokenCreatedAt: verificationTokenCreatedAt,
      },
    });

    return this.mapToUser(result);
  }

  public async findById(id: string): Promise<User | null> {
    const result = await this.model.findById(id);
    return result ? this.mapToUser(result) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const result = await this.model.findOne({ email });
    return result ? this.mapToUser(result) : null;
  }

  private mapToUser(model: HydratedDocument<IUser>): User {
    const {
      _id,
      email,
      profile: { nickname, about, avatarUrl },
      password,
      verified,
      chatServers,
    } = model.toJSON();

    return User.restore({
      id: _id,
      email: email,
      password: password,
      profile: { nickname, about, avatarUrl },
      chatServers: chatServers,
      verificationToken: verified.token,
      verificationTokenCreatedAt: verified.tokenCreatedAt,
      verifiedAt: verified.verifiedAt,
    });
  }
}
