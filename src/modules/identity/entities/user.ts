import z from "zod";
import { Id } from "@/shared/vo/Id.js";
import { Profile } from "./profile.js";
import { Email } from "./vo/email.js";
import { Password } from "./vo/password.js";

const userSchema = z.object({
  id: z.instanceof(Id),
  email: z.instanceof(Email),
  profile: z.custom<Profile>((value): value is Profile => value instanceof Profile),
  password: z.custom<Password>((value): value is Password => value instanceof Password),
  chatServers: z.array(z.instanceof(Id)).optional(),
});

type UserType = z.infer<typeof userSchema>;

export class User {
  private readonly MAX_CHAT_SERVERS = 10;

  private constructor(
    public readonly id: Id,
    private readonly email: Email,
    private readonly password: Password,
    private readonly profile: Profile,
    private chatServers: Id[],
  ) {}

  static create(value: UserType): User {
    const { email, id, password, profile } = userSchema.parse(value);

    return new User(id, email, password, profile, []);
  }

  static restore({ email, id, password, profile, chatServers }: UserType): User {
    return new User(id, email, password, profile, chatServers);
  }

  public getId(): string {
    return this.id.toString();
  }

  public getEmail(): string {
    return this.email.toString();
  }

  public getProfile() {
    return this.profile.toJSON();
  }

  public updateProfile(profile: Profile): void {
    this.profile.updateAbout(profile.toJSON().about);
    this.profile.updateAvatarUrl(profile.toJSON().avatarUrl);
    this.profile.updateNickname(profile.toJSON().nickname);
  }

  public async comparePassword(passwordInput: string) {
    return this.password.compare(passwordInput);
  }

  public getPassword(): string {
    return this.password.toString();
  }

  public addChatServer(serverId: Id) {
    if (this.chatServers.length >= this.MAX_CHAT_SERVERS) {
      // TODO: Create domain error class
      throw new Error(`User cannot have more than ${this.MAX_CHAT_SERVERS} chat servers`);
    }

    this.chatServers.push(serverId);
  }

  public removeChatServer(serverId: Id) {
    if (this.chatServers.find((id) => id.toString() === serverId.toString())) {
      // TODO: Create domain error class
      throw new Error("Chat server not found");
    }

    this.chatServers = this.chatServers.filter((id) => id.toString() !== serverId.toString());
  }

  public toJSON(): {
    id: string;
    profile: ReturnType<User["profile"]["toJSON"]>;
    email: string;
  } {
    return {
      id: this.id.toString(),
      profile: this.profile.toJSON(),
      email: this.email.toString(),
    };
  }
}
