import { randomUUID } from "node:crypto";
import dayjs from "dayjs";
import z, { ZodError } from "zod";
import { DomainError } from "@/shared/errors/domain-error.js";
import { formatZodError } from "@/shared/errors/zod-error-transform.js";
import { Id } from "@/shared/vo/Id.js";
import { Profile, profileSchema } from "./profile.js";
import { Email } from "./vo/email.js";
import { Password } from "./vo/password.js";

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  profile: profileSchema,
  password: z.string(),
  chatServers: z.array(z.string()),
  verificationToken: z.uuidv4().nullish(),
  verificationTokenCreatedAt: z.date().nullish(),
  verifiedAt: z.date().nullish(),
});

const createUserSchema = userSchema.omit({
  id: true,
  chatServers: true,
  verificationToken: true,
  verificationTokenCreatedAt: true,
  verifiedAt: true,
});

type UserType = z.infer<typeof userSchema>;
type UserCreateInput = z.infer<typeof createUserSchema>;

type UserOutput = {
  id: string;
  profile: ReturnType<User["profile"]["toJSON"]>;
  email: string;
  password?: string;
  chatServers: string[];
  verificationToken: string | null;
  verificationTokenCreatedAt: Date | null;
  verifiedAt: Date | null;
};

export class User {
  private readonly MAX_CHAT_SERVERS: number = 10;

  private constructor(
    public readonly id: Id,

    private readonly email: Email,
    private readonly password: Password,

    private profile: Profile,
    private chatServers: Id[] = [],

    private verificationTokenCreatedAt: Date | null = null,
    public verificationToken: string | null = null,
    public verifiedAt: Date | null = null,
  ) {}

  static async create(value: UserCreateInput): Promise<User> {
    try {
      const { email, password, profile } = createUserSchema.parse(value);

      const user = new User(
        new Id(),
        new Email(email),
        await Password.create(password),
        new Profile(profile.nickname, profile.about, profile.avatarUrl),
      );

      return user;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new DomainError("Invalid user data", 422, "Invalid data provided to restore user", formatZodError(error));
      }

      throw error;
    }
  }

  static restore({ email, id, password, profile, chatServers }: UserType): User {
    try {
      const userProfile = new Profile(profile.nickname, profile.about, profile.avatarUrl);
      return new User(
        new Id(id),
        new Email(email),
        Password.restore(password),
        userProfile,
        chatServers.map((chatServerId) => new Id(chatServerId)),
      );
    } catch (error) {
      console.log({ error });
      if (error instanceof ZodError) {
        throw new DomainError("Invalid user data", 422, "Invalid data provided to restore user", formatZodError(error));
      }

      throw error;
    }
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

  public addChatServer(serverId: string) {
    if (this.chatServers.length >= this.MAX_CHAT_SERVERS) {
      // TODO: Create domain error class
      throw new Error(`User cannot have more than ${this.MAX_CHAT_SERVERS} chat servers`);
    }

    const id = new Id(serverId);
    this.chatServers.push(id);
  }

  public removeChatServer(serverId: string) {
    if (!this.chatServers.find((id) => id.toString() === serverId)) {
      // TODO: Create domain error class
      throw new Error("Chat server not found");
    }

    this.chatServers = this.chatServers.filter((id) => id.toString() !== serverId.toString());
  }

  public isVerificationTokenValid(token: string): boolean {
    const isSameToken = this.verificationToken === token;
    const isNotExpired = dayjs(this.verificationTokenCreatedAt).add(24, "hours").isAfter(dayjs());

    return isSameToken && isNotExpired;
  }

  public setVerificationToken(): void {
    this.verificationToken = randomUUID();
    this.verificationTokenCreatedAt = new Date();
    this.verifiedAt = null;
  }

  public verify(token: string) {
    if (!this.isVerificationTokenValid(token)) {
      throw new Error("Invalid or expired token");
    }

    this.verifiedAt = new Date();
    this.verificationToken = null;
    this.verificationTokenCreatedAt = null;
  }

  public isVerified(): boolean {
    return !!this.verifiedAt;
  }

  public toJSON(config?: { includesPassword: boolean }): UserOutput {
    const user: UserOutput = {
      id: this.id.toString(),
      profile: this.profile.toJSON(),
      email: this.email.toString(),
      chatServers: this.chatServers.map((id) => id.toString()),
      verificationToken: this.verificationToken,
      verificationTokenCreatedAt: this.verificationTokenCreatedAt,
      verifiedAt: this.verifiedAt,
    };

    if (config?.includesPassword) {
      user.password = this.getPassword();
    }

    return user;
  }
}
