import { describe, expect, it } from "vitest";
import { DomainError } from "@/shared/errors/domain-error.js";
import { Email } from "./email.js";

describe("UNIT -> Email value object", () => {
  it("should create a valid email", () => {
    const defaultEmail = "teste@email.com";
    const email = new Email(defaultEmail);

    expect(email).toBeInstanceOf(Email);
    expect(email.toString()).toBe(defaultEmail);
  });

  it("should return the email string when toString() is called", () => {
    const emailString = "another@example.com";
    const email = new Email(emailString);
    expect(email.toString()).toBe(emailString);
  });

  it("should throw a DomainError for an invalid email format", () => {
    const invalidEmail = "invalid-email.com";
    const expectedError = new DomainError("Invalid email address", 422, "Invalid email address", {
      email: ["Invalid email address"],
    });
    expect(() => new Email(invalidEmail)).toThrow(expectedError);
  });

  it("should throw a DomainError with correct details for an invalid email", () => {
    const invalidEmail = "invalid-email.com";
    try {
      new Email(invalidEmail);
      // Fail test if constructor does not throw
      expect.fail("Constructor should have thrown a DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toHaveProperty("statusCode", 422);
      expect(error).toHaveProperty("message", "Invalid email address");
      expect(error).toHaveProperty("description", "Invalid email address");
      expect(error).toHaveProperty("fields", { email: ["Invalid email address"] });
    }
  });

  it("should throw a DomainError for an empty string", () => {
    const expectedError = new DomainError("Invalid email address", 422, "Invalid email address", {
      email: ["Invalid email address"],
    });
    expect(() => new Email("")).toThrow(expectedError);
  });

  it("should throw a DomainError if create method receives null", () => {
    const expectedError = new DomainError(
      "Invalid email address",
      422,
      "Invalid input: expected string, received null",
      {
        email: ["Invalid input: expected string, received null"],
      },
    );
    // @ts-expect-error testing invalid input
    expect(() => new Email(null)).toThrow(expectedError);
  });

  it("should throw a DomainError if create method receives a non-string value", () => {
    const expectedError = new DomainError(
      "Invalid email address",
      422,
      "Invalid input: expected string, received number",
      {
        email: ["Invalid input: expected string, received number"],
      },
    );
    // @ts-expect-error testing invalid input
    expect(() => new Email(123)).toThrow(expectedError);
  });
});
