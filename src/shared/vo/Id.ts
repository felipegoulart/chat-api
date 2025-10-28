import { randomUUID } from "node:crypto";
import z, { ZodError } from "zod";
import { DomainError } from "../errors/domain-error.js";

export class Id {
  private readonly value: string = "";

  constructor(value?: string) {
    try {
      if (!value) {
        this.value = randomUUID();
        return;
      }

      this.value = z.uuid({ version: "v4", error: "The provided ID is not a valid UUID." }).parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new DomainError("Invalid Id", 400, error.issues[0].message, {
          id: [error.issues[0].message],
        });
      }

      throw error;
    }
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Id): boolean {
    return this.value === other.value;
  }
}
