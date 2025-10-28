import { compare, hash } from "bcryptjs";
import z, { ZodError } from "zod";
import { DomainError } from "@/shared/errors/domain-error.js";
import { InternalError } from "@/shared/errors/internal-error.js";

export const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/,
    "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
  );

export class Password {
  private constructor(private readonly value: string) {}

  static async create(value: string): Promise<Password> {
    try {
      const password = passwordSchema.parse(value);
      const hashedPassword = await hash(password, 10);

      return new Password(hashedPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new DomainError("Invalid password", 422, error.issues[0].message, {
          password: [error.issues[0].message],
        });
      }
      throw error;
    }
  }

  static restore(value: string): Password {
    try {
      const bcryptHashRegex = /^\$2[aby]?\$\d{1,2}\$[A-Za-z0-9./]{53}$/;
      const hashedPassword = z.string().regex(bcryptHashRegex, "Invalid hash format").parse(value);

      return new Password(hashedPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new InternalError("Invalid password", 422, error.issues[0].message);
      }

      throw error;
    }
  }

  public async compare(password: string): Promise<boolean> {
    return await compare(password, this.value);
  }

  public toString() {
    return this.value.toString();
  }
}
