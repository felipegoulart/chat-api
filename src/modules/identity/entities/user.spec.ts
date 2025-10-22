import { beforeAll, describe, expect, it, vi } from "vitest";
import { Id } from "@/shared/vo/Id.js";
import { Profile } from "./profile.js";
import { User } from "./user.js";
import { Email } from "./vo/email.js";
import { Password } from "./vo/password.js";

describe("UNIT -> User entity", () => {
  let id: Id;
  let email: Email;
  let password: Password;
  let profile: Profile;

  beforeAll(async () => {
    id = new Id();
    email = new Email("test@example.com");
    password = await Password.create("ValidPassword123!");
    profile = Profile.create({ nickname: "tester" });
  });

  describe("create()", () => {
    it("should create a User instance with valid data", () => {
      const user = User.create({ id, email, password, profile });

      expect(user).toBeInstanceOf(User);
      expect(user.getId()).toBe(id.toString());
      expect(user.getEmail()).toBe("test@example.com");
      expect(user.getProfile().nickname).toBe("tester");
      expect(user.toJSON().id).toBe(id.toString());
    });

    it("should create a user with an empty list of chat servers", () => {
      const user = User.create({ id, email, password, profile });
      const userJson = user.toJSON();

      // Ensure chatServers is not part of the public JSON representation
      expect(userJson).not.toHaveProperty("chatServers");
    });
  });

  describe("restore()", () => {
    it("should restore a User instance with all its data", () => {
      const serverId1 = new Id();
      const serverId2 = new Id();
      const user = User.restore({
        id,
        email,
        password,
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
    it("should get the user's profile as a JSON object", () => {
      const user = User.create({ id, email, password, profile });
      const userProfile = user.getProfile();

      expect(userProfile).toEqual({
        nickname: "tester",
        about: undefined,
        avatarUrl: undefined,
      });
    });

    it("should update the user's profile", () => {
      const user = User.create({ id, email, password, profile });
      const newProfile = Profile.create({
        nickname: "new_tester",
        about: "I am a new tester",
        avatarUrl: "https://example.com/new.png",
      });

      user.updateProfile(newProfile);

      expect(user.getProfile()).toEqual({
        nickname: "new_tester",
        about: "I am a new tester",
        avatarUrl: "https://example.com/new.png",
      });
    });
  });

  describe("Password management", () => {
    it("should return the hashed password string", () => {
      vi.spyOn(password, "toString");
      const user = User.create({ id, email, password, profile });
      const userPassword = user.getPassword();

      expect(password.toString).toBeCalledTimes(1);
      expect(userPassword).toBe(password.toString());
    });

    it("should correctly compare a valid password", async () => {
      vi.spyOn(password, "compare").mockResolvedValue(true);
      const user = User.create({ id, email, password, profile });
      const isMatch = await user.comparePassword("ValidPassword123!");
      expect(isMatch).toBe(true);
    });

    it("should correctly fail to compare an invalid password", async () => {
      vi.spyOn(password, "compare").mockResolvedValue(false);
      const user = User.create({ id, email, password, profile });
      const isMatch = await user.comparePassword("WrongPassword!");
      expect(isMatch).toBe(false);
    });
  });

  describe("Chat Server management", () => {
    it("should add a chat server to the user", () => {
      const user = User.create({ id, email, password, profile });
      const serverId = new Id();
      user.addChatServer(serverId);
      expect(() => user.removeChatServer(serverId)).not.toThrow();
    });

    it("should remove a chat server from the user", () => {
      const serverId = new Id();
      const user = User.restore({
        id,
        email,
        password,
        profile,
        chatServers: [serverId],
      });
      user.removeChatServer(serverId);
      expect(() => user.removeChatServer(serverId)).toThrow("Chat server not found");
    });

    it("should throw an error when trying to remove a non-existent chat server", () => {
      const user = User.create({ id, email, password, profile });
      const nonExistentServerId = new Id();
      expect(() => user.removeChatServer(nonExistentServerId)).toThrow("Chat server not found");
    });

    it("should throw an error when adding more than the maximum number of chat servers", () => {
      const serverIds = Array.from({ length: 10 }, () => new Id());
      const user = User.restore({ id, email, password, profile, chatServers: serverIds });
      const extraServerId = new Id();

      expect(() => user.addChatServer(extraServerId)).toThrow("User cannot have more than 10 chat servers");
    });
  });
});
