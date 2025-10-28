import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/errors/domain-error.js";
import { EmailAlreadyExistsError } from "./email-already-exists-error.js";

describe("UNIT -> EmailAlreadyExistsError", () => {
  it("should create an instance with default values", () => {
    const fields = { email: ["The provided email address is already registered."] };
    const error = new EmailAlreadyExistsError({ fields });

    expect(error).toBeInstanceOf(EmailAlreadyExistsError);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe("Email already exists");
    expect(error.statusCode).toBe(409); // Conflict
    expect(error.description).toBe(
      "The provided email address is already registered. Please use a different email or log in.",
    );
    expect(error.fields).toEqual(fields);
    expect(error.name).toBe("EmailAlreadyExistsError");
  });

  it("should create an instance with custom values", () => {
    const message = "Custom Message";
    const description = "Custom Description.";
    const statusCode = 400;
    const fields = { email: ["Custom field error"] };

    const error = new EmailAlreadyExistsError({ message, description, statusCode, fields });

    expect(error).toBeInstanceOf(EmailAlreadyExistsError);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.description).toBe(description);
    expect(error.fields).toEqual(fields);
    expect(error.name).toBe("EmailAlreadyExistsError");
  });
});
