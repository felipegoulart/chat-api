import type { UserRepository } from "../../../infrastructure/repository.js";
import { User } from "../../entities/user.js";

type RegisterUserInput = {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  about?: string;
  avatarUrl?: string;
};

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  public async register({
    nickname,
    confirmPassword,
    email,
    password,
    about,
    avatarUrl,
  }: RegisterUserInput): Promise<User> {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const result = await this.repository.findByEmail(email);
    if (result) {
      throw new Error("User already exists");
    }

    const user = await User.create({
      email,
      password,
      profile: {
        nickname,
        about,
        avatarUrl,
      },
    });

    user.setVerificationToken();

    return await this.repository.create(user);
  }
}
