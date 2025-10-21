import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { HttpServer } from "@/server.js";
import { UserModel } from "../infrastructure/user-model.js";

describe("E2E -> Authorization", async () => {
  const server = new HttpServer();
  let app: FastifyInstance;
  const defaultUser = {
    nickname: "UserTest",
    email: "user@test.com",
    password: "123@Test",
    confirm: "123@Test",
  };

  beforeAll(async () => {
    app = await server.createServer();
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
    await UserModel.create({
      nickname: "UserTest",
      email: "user@test.com",
      password: "123@Test",
    });

    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: defaultUser,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "User already exists",
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
        confirm: defaultUser.confirm,
      },
    });

    expect(response.statusCode).toBe(422);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        error: "Response Validation Error",
        details: {
          issues: expect.arrayContaining([
            expect.objectContaining({
              instancePath: "/nickname",
              keyword: "too_small",
              message: "Too small: expected string to have >=3 characters",
            }),
          ]),
          method: "POST",
          url: "/auth/register",
        },
      }),
    );
  });
});
