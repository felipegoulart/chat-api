import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { Profile } from "./profile.js";

describe("UNIT -> Profile entity", () => {
  const validProfileData = {
    nickname: "testuser",
    about: "This is a test user.",
    avatarUrl: "https://example.com/avatar.png",
  };

  const minimalProfileData = {
    nickname: "min_user",
  };

  describe("create()", () => {
    it("should create a Profile instance with all valid properties", () => {
      const profile = Profile.create(validProfileData);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.toJSON()).toEqual(validProfileData);
    });

    it("should create a Profile instance with only the required properties", () => {
      const profile = Profile.create(minimalProfileData);
      expect(profile).toBeInstanceOf(Profile);
      expect(profile.toJSON()).toEqual({
        nickname: "min_user",
        about: undefined,
        avatarUrl: undefined,
      });
    });

    it("should throw an error if nickname is too short", () => {
      const invalidData = { ...validProfileData, nickname: "a" };
      expect(() => Profile.create(invalidData)).toThrow(ZodError);
    });

    it("should throw an error if nickname is too long", () => {
      const invalidData = { ...validProfileData, nickname: "a".repeat(33) };
      expect(() => Profile.create(invalidData)).toThrow(ZodError);
    });

    it("should throw an error if about is too long", () => {
      const invalidData = { ...validProfileData, about: "a".repeat(129) };
      expect(() => Profile.create(invalidData)).toThrow(ZodError);
    });

    it("should throw an error if avatarUrl is not a valid URL", () => {
      const invalidData = { ...validProfileData, avatarUrl: "not-a-url" };
      expect(() => Profile.create(invalidData)).toThrow(ZodError);
    });
  });

  describe("updateNickname()", () => {
    it("should update the nickname successfully", () => {
      const profile = Profile.create(minimalProfileData);
      const newNickname = "new_nickname";
      profile.updateNickname(newNickname);
      expect(profile.toJSON().nickname).toBe(newNickname);
    });

    it("should throw an error for an invalid nickname", () => {
      const profile = Profile.create(minimalProfileData);
      expect(() => profile.updateNickname("a")).toThrow(ZodError);
    });
  });

  describe("updateAbout()", () => {
    it("should update the about text successfully", () => {
      const profile = Profile.create(minimalProfileData);
      const newAbout = "A new about section.";
      profile.updateAbout(newAbout);
      expect(profile.toJSON().about).toBe(newAbout);
    });

    it("should allow clearing the about text", () => {
      const profile = Profile.create(validProfileData);
      profile.updateAbout(undefined);
      expect(profile.toJSON().about).toBeUndefined();
    });

    it("should throw an error for overly long about text", () => {
      const profile = Profile.create(minimalProfileData);
      const longAbout = "a".repeat(129);
      expect(() => profile.updateAbout(longAbout)).toThrow(ZodError);
    });
  });

  describe("updateAvatarUrl()", () => {
    it("should update the avatar URL successfully", () => {
      const profile = Profile.create(minimalProfileData);
      const newAvatarUrl = "https://example.com/new.png";
      profile.updateAvatarUrl(newAvatarUrl);
      expect(profile.toJSON().avatarUrl).toBe(newAvatarUrl);
    });

    it("should allow clearing the avatar URL", () => {
      const profile = Profile.create(validProfileData);
      profile.updateAvatarUrl(undefined);
      expect(profile.toJSON().avatarUrl).toBeUndefined();
    });

    it("should throw an error for an invalid avatar URL", () => {
      const profile = Profile.create(minimalProfileData);
      const invalidUrl = "not-a-valid-url";
      expect(() => profile.updateAvatarUrl(invalidUrl)).toThrow(ZodError);
    });
  });
});
