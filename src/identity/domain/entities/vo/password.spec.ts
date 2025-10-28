import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { DomainError } from "@/shared/errors/domain-error.js";
import { InternalError } from "@/shared/errors/internal-error.js";
import { Password } from "./password.js";

describe("UNIT -> Password value object", () => {
  const validPasswordString = "ValidPassword123!";
  const invalidPasswordString = "short";
  const validHashedPassword = "$2a$10$abcdefghijklmnopqrstuvwx.abcdefghijklmnopqrstuvwx";
  const invalidHashedPassword = "not-a-valid-hash";

  describe("create()", () => {
    it("should create a Password instance with a hashed value for a valid password", async () => {
      const password = await Password.create(validPasswordString);

      expect(password).toBeInstanceOf(Password);
      expect(password.toString()).toEqual(expect.any(String));
    });

    it("should throw a DomainError for an invalid password (too short)", async () => {
      await expect(Password.create(invalidPasswordString)).rejects.toThrow(
        new DomainError(
          "Invalid password",
          422,
          "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
          {
            password: [
              "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
            ],
          },
        ),
      );
    });

    it("should throw a DomainError for an invalid password (missing uppercase)", async () => {
      await expect(Password.create("validpassword123!")).rejects.toThrow(DomainError);
    });

    it("should throw a DomainError for an invalid password (missing lowercase)", async () => {
      await expect(Password.create("VALIDPASSWORD123!")).rejects.toThrow(DomainError);
    });

    it("should throw a DomainError for an invalid password (missing number)", async () => {
      await expect(Password.create("ValidPassword!!")).rejects.toThrow(DomainError);
    });

    it("should throw a DomainError for an invalid password (missing special character)", async () => {
      await expect(Password.create("ValidPassword123")).rejects.toThrow(DomainError);
    });

    it("should throw a DomainError with correct details for an invalid password", async () => {
      try {
        await Password.create(invalidPasswordString);
        expect.fail("Password.create should have thrown a DomainError");
      } catch (error) {
        expect(error).toBeInstanceOf(DomainError);
        expect(error).toHaveProperty("statusCode", 422);
        expect(error).toHaveProperty("message", "Invalid password");
        expect(error).toHaveProperty(
          "description",
          "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
        );
        expect(error).toHaveProperty("fields", {
          password: [
            "Your password must have at least 8 at 32 characters, one uppercase, one lowercase, one number and one special character",
          ],
        });
      }
    });

    it("should throw a DomainError if create method receives null", async () => {
      await expect(
        // @ts-expect-error testing invalid input
        Password.create(null),
      ).rejects.toThrow(
        new DomainError("Invalid password", 422, "Invalid input: expected string, received null", {
          password: ["Invalid input: expected string, received null"],
        }),
      );
    });

    it("should throw a DomainError if create method receives a non-string value", async () => {
      await expect(
        // @ts-expect-error testing invalid input
        Password.create(123),
      ).rejects.toThrow(
        new DomainError("Invalid password", 422, "Invalid input: expected string, received number", {
          password: ["Invalid input: expected string, received number"],
        }),
      );
    });
  });

  describe("restore()", () => {
    it("should restore a Password instance from a valid hash", async () => {
      const validHashedPassword = (await Password.create(validPasswordString)).toString();
      const password = Password.restore(validHashedPassword);

      expect(password).toBeInstanceOf(Password);
      expect(password.toString()).toEqual(validHashedPassword);
    });

    it("should throw a InternalError for an invalid hash format", () => {
      expect(() => Password.restore(invalidHashedPassword)).toThrow(
        new InternalError("Invalid password", 422, "Invalid hash format"),
      );
    });

    it("should throw a InternalError with correct details for an invalid hash", () => {
      try {
        Password.restore(invalidHashedPassword);
        expect.fail("Password.restore should have thrown a InternalError");
      } catch (error) {
        expect(error).toBeInstanceOf(InternalError);
        expect(error).toHaveProperty("statusCode", 422);
        expect(error).toHaveProperty("message", "Invalid password");
        expect(error).toHaveProperty("description", "Invalid hash format");
      }
    });

    it("should throw a InternalError if restore method receives null", () => {
      expect(
        // @ts-expect-error testing invalid input
        () => Password.restore(null),
      ).toThrow(new InternalError("Invalid password", 422, "Invalid input: expected string, received null"));
    });
  });

  describe("compare()", () => {
    it("should return true for a correct password", async () => {
      const password = await Password.create(validPasswordString);
      const isMatch = await password.compare(validPasswordString);
      expect(isMatch).toBe(true);
    });

    it("should return false for an incorrect password", async () => {
      const password = await Password.create(validPasswordString);
      const isMatch = await password.compare("WrongPassword123!");
      expect(isMatch).toBe(false);
    });
  });

  describe("toString()", () => {
    it("should return the hashed password string", async () => {
      const password = await Password.create(validPasswordString);
      expect(password.toString()).toEqual(expect.any(String));
    });
  });
});
