import z, { ZodError } from "zod";
import { DomainError } from "@/shared/errors/domain-error.js";

export const emailSchema = z.email();

export class Email {
  private readonly value: string = "";

  constructor(value: string) {
    try {
      this.value = emailSchema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new DomainError("Invalid email address", 422, error.issues[0].message, {
          email: [error.issues[0].message],
        });
      }

      throw error;
    }
  }

  toString() {
    return this.value.toString();
  }
}
