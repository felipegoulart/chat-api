import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { formatZodError } from "./zod-error-transform.js";

describe("UNIT -> formatZodError", () => {
  it("should format a simple ZodError with a single issue", () => {
    const schema = z.object({
      nickname: z.string().min(3, "Nickname must be at least 3 characters long"),
    });

    try {
      schema.parse({ nickname: "a" });
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = formatZodError(error);
        expect(formatted).toEqual({
          nickname: ["Nickname must be at least 3 characters long"],
        });
      }
    }
  });

  it("should format a ZodError with multiple issues on different fields", () => {
    const schema = z.object({
      email: z.email("Invalid email format"),
      password: z.string().min(8, "Password is too short"),
    });

    try {
      schema.parse({ email: "invalid-email", password: "123" });
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = formatZodError(error);
        expect(formatted).toEqual({
          email: ["Invalid email format"],
          password: ["Password is too short"],
        });
      }
    }
  });

  it("should format a ZodError with a nested object path", () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          nickname: z.string().min(3, "Nickname is too short"),
        }),
      }),
    });

    try {
      schema.parse({ user: { profile: { nickname: "a" } } });
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = formatZodError(error);
        expect(formatted).toEqual({
          "user.profile.nickname": ["Nickname is too short"],
        });
      }
    }
  });

  it("should return an empty object for a ZodError with no issues", () => {
    const error = new ZodError([]);
    const formatted = formatZodError(error);
    expect(formatted).toEqual({});
  });
});
