import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { Profile } from "./profile.js";

describe("UNIT -> Profile entity", () => {
  const nickname = "testuser";
  const about = "This is a test user.";
  const avatarUrl = "https://example.com/avatar.png";

  describe("create()", () => {
    it("should create a Profile instance with all valid properties", () => {
      const profile = new Profile(nickname, about, avatarUrl);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.toJSON()).toEqual({ nickname, about, avatarUrl });
    });

    it("should create a Profile instance with only the required properties", () => {
      const profile = new Profile(nickname);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.toJSON()).toEqual({
        nickname: "testuser",
        about: undefined,
        avatarUrl: undefined,
      });
    });

    it("should throw an error if nickname is too short", () => {
      const invalidNickname = "a";
      expect(() => new Profile(invalidNickname, about, avatarUrl)).toThrow(ZodError);
    });

    it("should throw an error if nickname is too long", () => {
      const invalidNickname = "a".repeat(33);
      expect(() => new Profile(invalidNickname, about, avatarUrl)).toThrow(ZodError);
    });

    it("should throw an error if about is too long", () => {
      const tooLongAbout = "a".repeat(129);
      expect(() => new Profile(nickname, tooLongAbout, avatarUrl)).toThrow(ZodError);
    });

    it("should throw an error if avatarUrl is not a valid URL", () => {
      const invalidAvatarUrl = "not-a-url";
      expect(() => new Profile(nickname, about, invalidAvatarUrl)).toThrow(ZodError);
    });
  });

  describe("updateNickname()", () => {
    it("should update the nickname successfully", () => {
      const profile = new Profile(nickname);
      const newNickname = "new_nickname";
      profile.updateNickname(newNickname);
      expect(profile.toJSON().nickname).toBe(newNickname);
    });

    it("should throw an error for an invalid nickname", () => {
      const profile = new Profile(nickname);
      expect(() => profile.updateNickname("a")).toThrow(ZodError);
    });
  });

  describe("updateAbout()", () => {
    it("should update the about text successfully", () => {
      const profile = new Profile(nickname);
      const newAbout = "A new about section.";
      profile.updateAbout(newAbout);
      expect(profile.toJSON().about).toBe(newAbout);
    });

    it("should allow clearing the about text", () => {
      const profile = new Profile(nickname, about, avatarUrl);
      profile.updateAbout(undefined);
      expect(profile.toJSON().about).toBeUndefined();
    });

    it("should throw an error for overly long about text", () => {
      const profile = new Profile(nickname);
      const longAbout = "a".repeat(129);
      expect(() => profile.updateAbout(longAbout)).toThrow(ZodError);
    });
  });

  describe("updateAvatarUrl()", () => {
    it("should update the avatar URL successfully", () => {
      const profile = new Profile(nickname);
      const avatarUrl = "https://example.com/new.png";
      profile.updateAvatarUrl(avatarUrl);
      expect(profile.toJSON().avatarUrl).toBe(avatarUrl);
    });

    it("should allow clearing the avatar URL", () => {
      const profile = new Profile(nickname, about, avatarUrl);
      profile.updateAvatarUrl(undefined);
      expect(profile.toJSON().avatarUrl).toBeUndefined();
    });

    it("should throw an error for an invalid avatar URL", () => {
      const profile = new Profile(nickname);
      const invalidUrl = "not-a-valid-url";
      expect(() => profile.updateAvatarUrl(invalidUrl)).toThrow(ZodError);
    });
  });
});
