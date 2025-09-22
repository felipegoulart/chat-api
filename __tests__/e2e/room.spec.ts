import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server";

describe("E2E -> Server", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  it("should return a rooms list", async () => {
    const response = await app.inject({ method: "GET", url: "/rooms" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: [
        {
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  it("should create a room", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { name: "Room 1", description: "This is room 1" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: expect.any(String),
      name: "Room 1",
      description: "This is room 1",
      code: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
