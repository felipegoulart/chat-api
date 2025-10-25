import type { HydratedDocument, Model } from "mongoose";
import { Id } from "@/shared/vo/Id.js";
import { Profile } from "../entities/profile.js";
import { User } from "../entities/user.js";
import { Email } from "../entities/vo/email.js";
import { Password } from "../entities/vo/password.js";
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

  public async findById(id: Id): Promise<User | null> {
    const result = await this.model.findById(id.toString());
    return result ? this.mapToUser(result) : null;
  }

  public async findByEmail(email: Email): Promise<User | null> {
    const result = await this.model.findOne({ email: email.toString() });
    return result ? this.mapToUser(result) : null;
  }

  private mapToUser(model: HydratedDocument<IUser>): User {
    const { _id, email, profile, password, verified, chatServers } = model.toJSON();
    return User.restore({
      id: new Id(_id),
      email: new Email(email),
      password: Password.restore(password),
      profile: new Profile(profile.nickname, profile.about, profile.avatarUrl),
      chatServers: chatServers.map((id) => new Id(id)),
      verificationToken: verified.token,
      verificationTokenCreatedAt: verified.tokenCreatedAt,
      verifiedAt: verified.verifiedAt,
    });
  }
}
