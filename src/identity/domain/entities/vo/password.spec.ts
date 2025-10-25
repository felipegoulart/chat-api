import { describe, expect, it } from "vitest";
import { Password } from "./password.js";

describe("UNIT -> Password value object", () => {
  const validPassword = "Password123!";
  const wrongPassword = "WrongPassword123!";

  it("should create a password instance with a valid password string", async () => {
    const password = await Password.create(validPassword);
    expect(password).toBeInstanceOf(Password);
    expect(password.toString()).not.toBe(validPassword); // Should be hashed
  });

  it("should successfully compare a correct password", async () => {
    const password = await Password.create(validPassword);
    const isMatch = await password.compare(validPassword);
    expect(isMatch).toBe(true);
  });

  it("should fail to compare an incorrect password", async () => {
    const password = await Password.create(validPassword);
    const isMatch = await password.compare(wrongPassword);
    expect(isMatch).toBe(false);
  });

  it("should restore a password object from a hash", () => {
    const hash = "$2b$10$abcdefghijklmnopqrstuv";
    const password = Password.restore(hash);
    expect(password).toBeInstanceOf(Password);
    expect(password.toString()).toBe(hash);
  });

  it("should throw an error for a password that is too short", async () => {
    await expect(Password.create("Pass1!")).rejects.toThrow();
  });

  it("should throw an error for a password without a lowercase letter", async () => {
    await expect(Password.create("PASSWORD123!")).rejects.toThrow();
  });

  it("should throw an error for a password without an uppercase letter", async () => {
    await expect(Password.create("password123!")).rejects.toThrow();
  });

  it("should throw an error for a password without a number", async () => {
    await expect(Password.create("Password!")).rejects.toThrow();
  });

  it("should throw an error for a password without a special character", async () => {
    await expect(Password.create("Password123")).rejects.toThrow();
  });

  it("should throw an error for an empty string", async () => {
    await expect(Password.create("")).rejects.toThrow();
  });

  it("should throw an error for a null value", async () => {
    // @ts-expect-error testing invalid input
    await expect(Password.create(null)).rejects.toThrow();
  });

  it("should throw an error for an undefined value", async () => {
    // @ts-expect-error testing invalid input
    await expect(Password.create(undefined)).rejects.toThrow();
  });
});
