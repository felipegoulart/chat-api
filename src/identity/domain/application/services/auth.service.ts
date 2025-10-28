import type { UserRepository } from "../../../persistence/repository.js";
import { User } from "../../entities/user.js";
import { EmailAlreadyExistsError } from "../../errors/email-already-exists-error.js";
import { PasswordsDoNotMatchError } from "../../errors/passwords-do-not-match-error.js";

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
      throw new PasswordsDoNotMatchError({
        fields: {
          confirmPassword: ["Passwords don't match"],
        },
      });
    }

    const result = await this.repository.findByEmail(email);
    if (result) {
      throw new EmailAlreadyExistsError({
        fields: {
          email: ["The provided email address is already registered. Please use a different email or log in."],
        },
      });
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
