import { compare, hash } from "bcryptjs";
import z from "zod";

export const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/,
    "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
  );

export class Password {
  private constructor(private readonly value: string) {}

  static async create(value: string): Promise<Password> {
    const password = passwordSchema.parse(value);
    const hashedPassword = await hash(password, 10);
    return new Password(hashedPassword);
  }

  static restore(value: string): Password {
    return new Password(value);
  }

  public async compare(password: string): Promise<boolean> {
    return await compare(password, this.value);
  }

  public toString() {
    return this.value.toString();
  }
}
