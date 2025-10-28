import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Id } from "@/shared/vo/Id.js";
import { Profile } from "./profile.js";
import { User } from "./user.js";
import { Password } from "./vo/password.js";

describe("UNIT -> User entity", () => {
  let email: string;
  let password: string;
  let hashedPassword: string;
  let profile: ReturnType<User["profile"]["toJSON"]>;

  beforeAll(async () => {
    email = "test@example.com";
    password = "ValidPassword123!";
    hashedPassword = (await Password.create(password)).toString();
    profile = { nickname: "tester" };
  });

  describe("create()", () => {
    it("should create a User instance with valid data", async () => {
      const user = await User.create({ email, password, profile });

      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toEqual(expect.any(String));
      expect(user.getEmail()).toEqual("test@example.com");
      expect(user.getProfile().nickname).toBe("tester");
      expect(user.toJSON().id).toEqual(expect.any(String));
    });

    it("should create a user with an empty list of chat servers", async () => {
      const user = await User.create({ email, password, profile });
      const userJson = user.toJSON();

      expect(userJson).toHaveProperty("chatServers");
    });
  });

  describe("restore()", () => {
    it("should restore a User instance with all its data", async () => {
      const id = randomUUID();
      const serverId1 = new Id().toString();
      const serverId2 = new Id().toString();
      const user = User.restore({
        id,
        email,
        password: hashedPassword,
        profile,
        chatServers: [serverId1, serverId2],
      });

      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBe(id.toString());

      // Test internal state after restoration
      user.removeChatServer(serverId1);
      expect(() => user.removeChatServer(serverId1)).toThrow("Chat server not found");
    });
  });

  describe("Profile management", () => {
    it("should get the user's profile as a JSON object", async () => {
      const user = await User.create({ email, password, profile });
      const userProfile = user.getProfile();

      expect(userProfile).toEqual({
        nickname: "tester",
        about: undefined,
        avatarUrl: undefined,
      });
    });

    it("should update the user's profile", async () => {
      const user = await User.create({ email, password, profile });
      const newProfile = new Profile("new_tester", "I am a new tester", "https://example.com/new.png");

      user.updateProfile(newProfile);

      expect(user.getProfile()).toEqual({
        nickname: "new_tester",
        about: "I am a new tester",
        avatarUrl: "https://example.com/new.png",
      });
    });
  });

  describe("Password management", () => {
    it("should return the hashed password string", async () => {
      const user = await User.create({ email, password, profile });
      const userPassword = user.getPassword();

      expect(userPassword).toEqual(expect.any(String));
      expect(userPassword).not.toBe(password);
    });

    it("should correctly compare a valid password", async () => {
      const user = await User.create({ email, password, profile });
      const isMatch = await user.comparePassword("ValidPassword123!");
      expect(isMatch).toBe(true);
    });
  });

  describe("Chat Server management", () => {
    it("should add a chat server to the user", async () => {
      const user = await User.create({ email, password, profile });
      const serverId = new Id().toString();
      user.addChatServer(serverId);
      expect(() => user.removeChatServer(serverId)).not.toThrow();
    });

    it("should remove a chat server from the user", () => {
      const id = new Id().toString();
      const serverId = new Id().toString();
      const user = User.restore({
        id,
        email,
        password: hashedPassword,
        profile,
        chatServers: [serverId],
      });
      user.removeChatServer(serverId);
      expect(() => user.removeChatServer(serverId)).toThrow("Chat server not found");
    });

    it("should throw an error when trying to remove a non-existent chat server", async () => {
      const user = await User.create({ email, password, profile });
      const nonExistentServerId = new Id().toString();
      expect(() => user.removeChatServer(nonExistentServerId)).toThrow("Chat server not found");
    });

    it("should throw an error when adding more than the maximum number of chat servers", () => {
      const id = new Id().toString();
      const serverIds = Array.from({ length: 10 }, () => new Id().toString());

      const user = User.restore({ id, email, password: hashedPassword, profile, chatServers: serverIds });
      const extraServerId = new Id().toString();

      expect(() => user.addChatServer(extraServerId)).toThrow("User cannot have more than 10 chat servers");
    });
  });

  describe("Verification management", () => {
    it("should set verification token details", async () => {
      const user = await User.create({ email, password, profile });
      user.setVerificationToken();

      const userJson = user.toJSON();

      expect(userJson.verificationToken).toEqual(expect.any(String));
      expect(userJson.verificationTokenCreatedAt).toBeInstanceOf(Date);
      expect(userJson.verifiedAt).toBeNull();
    });

    it("should return false for a non-verified user", async () => {
      const user = await User.create({ email, password, profile });
      expect(user.isVerified()).toBe(false);
    });

    it("should verify a user with a valid token", async () => {
      const user = await User.create({ email, password, profile });
      user.setVerificationToken();
      const token = user.verificationToken as string;

      user.verify(token);

      expect(user.isVerified()).toBe(true);
      const userJson = user.toJSON();
      expect(userJson.verifiedAt).toBeInstanceOf(Date);
      expect(userJson.verificationToken).toBeNull();
      expect(userJson.verificationTokenCreatedAt).toBeNull();
    });

    it("should throw an error when verifying with an invalid token", async () => {
      const user = await User.create({ email, password, profile });
      user.setVerificationToken();

      expect(() => user.verify("invalid-token")).toThrow("Invalid or expired token");
    });

    it("should throw an error when verifying with an expired token", async () => {
      vi.useFakeTimers();
      const user = await User.create({ email, password, profile });
      user.setVerificationToken();
      const token = user.toJSON().verificationToken as string;

      // Advance time by 25 hours
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      expect(() => user.verify(token)).toThrow("Invalid or expired token");

      vi.useRealTimers();
    });

    it("should return true for a valid token that is not expired", async () => {
      const user = await User.create({ email, password, profile });
      user.setVerificationToken();
      const token = user.toJSON().verificationToken as string;

      const isValid = user.isVerificationTokenValid(token);

      expect(isValid).toBe(true);
    });
  });
});
