import type { FastifyInstance } from "fastify";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { UserModel } from "@/identity/persistence/user-model.js";
import { HttpServer } from "@/server.js";

describe("E2E -> Authorization", async () => {
  const server = new HttpServer();
  let app: FastifyInstance;
  const defaultUser = {
    nickname: "UserTest",
    email: "user@test.com",
    password: "123@Test",
    confirmPassword: "123@Test",
  };

  beforeAll(async () => {
    app = await server.createServer();
  });

  afterEach(async () => {
    await UserModel.deleteMany();
  });

  it("should allow to create an user", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: defaultUser,
    });

    expect(response.statusCode).toBe(201);
    expect(await response.json()).toEqual({
      message: "Created",
    });
  });

  it("should return 409 http code when email already exists", async () => {
    await app.inject({
      method: "POST",
      url: "/auth/register",
      body: defaultUser,
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: defaultUser,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      code: 409,
      description: "The provided email address is already registered. Please use a different email or log in.",
      error: "Conflict",
      fields: {
        email: ["The provided email address is already registered. Please use a different email or log in."],
      },
      message: "Email already exists",
    });
  });

  it("should return 422 http code when is missing some field", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: {
        nickname: "",
        email: defaultUser.email,
        password: defaultUser.password,
        confirmPassword: defaultUser.confirmPassword,
      },
    });

    expect(response.statusCode).toBe(422);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        code: 422,
        description: "Invalid data provided to restore user",
        error: "Unprocessable Entity",
        fields: {
          "profile.nickname": ["Too small: expected string to have >=3 characters"],
        },
      }),
    );
  });
});
