import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server";

describe("E2E -> User", () => {
  let app: FastifyInstance;
  const defaultUser = {
    username: "UserTest",
    email: "user@test.com",
    password: "123@Test",
    confirm: "123@Test",
  };

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  it("should create a user", async () => {
    const response = await supertest(app.server).post("/users").send(defaultUser);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Created",
      data: expect.objectContaining({
        id: expect.any(String),
        username: defaultUser.username,
        email: defaultUser.email,
      }),
    });
  });
});
