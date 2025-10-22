import { randomUUID } from "node:crypto";
import dayjs from "dayjs";
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
  private readonly MAX_CHAT_SERVERS: number = 10;
  private verificationTokenCreatedAt?: Date;

  public verifiedAt?: Date;
  public verificationToken?: string;

  private constructor(
    public readonly id: Id,
    private readonly email: Email,
    private readonly password: Password,
    private profile: Profile,
    private chatServers: Id[] = [],
  ) {}

  static create(value: Omit<UserType, "chatServers">): User {
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
    this.profile = profile;
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
    if (!this.chatServers.find((id) => id.toString() === serverId.toString())) {
      // TODO: Create domain error class
      throw new Error("Chat server not found");
    }

    this.chatServers = this.chatServers.filter((id) => id.toString() !== serverId.toString());
  }

  public isVerificationTokenValid(token: string): boolean {
    const isSameToken = this.verificationToken === token;
    const isNotExpired = dayjs(this.verificationTokenCreatedAt).add(24, "hours").isBefore(dayjs());

    return isSameToken && isNotExpired;
  }

  public setVerificationToken(): void {
    this.verificationToken = randomUUID();
    this.verificationTokenCreatedAt = new Date();
    this.verifiedAt = undefined;
  }

  public verify(token: string) {
    if (!this.isVerificationTokenValid(token)) {
      throw new Error("Invalid or expired token");
    }

    this.verifiedAt = new Date();
    this.verificationToken = undefined;
    this.verificationTokenCreatedAt = undefined;
  }

  public isVerified(): boolean {
    return !!this.verifiedAt;
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
