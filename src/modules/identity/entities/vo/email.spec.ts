import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
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

  it("should throw an error when passing an invalid email format (missing @)", () => {
    const invalidEmail = "invalid-email.com";
    expect(() => new Email(invalidEmail)).toThrow(ZodError);
  });

  it("should throw an error when passing an invalid email format (missing domain)", () => {
    const invalidEmail = "user@";
    expect(() => new Email(invalidEmail)).toThrow(ZodError);
  });

  it("should throw an error when passing an invalid email format (invalid characters)", () => {
    const invalidEmail = "user name@example.com"; // Space is invalid
    expect(() => new Email(invalidEmail)).toThrow(ZodError);
  });

  it("should throw an error for an empty string", () => {
    expect(() => new Email("")).toThrow(ZodError);
  });

  it("should throw an error if create method receives null", () => {
    // @ts-expect-error testing invalid input
    expect(() => new Email(null)).toThrow(ZodError);
  });

  it("should throw an error if create method receives undefined", () => {
    // @ts-expect-error testing invalid input
    expect(() => new Email(undefined)).toThrow(ZodError);
  });

  it("should throw an error if create method receives a non-string value", () => {
    // @ts-expect-error testing invalid input
    expect(() => new Email(123)).toThrow(ZodError);
  });
});
