import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server";

describe("E2E -> Server", () => {
  let app: FastifyInstance;
  const defaultRoom = { name: "Room 1", description: "This is room 1" };

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  it("should create a room", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: defaultRoom,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      ...defaultRoom,
      id: expect.any(String),
      code: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it("should return a rooms list", async () => {
    const response = await app.inject({ method: "GET", url: "/rooms" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: expect.arrayContaining([
        {
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]),
    });
  });

  it("should return a room by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: defaultRoom,
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({ method: "GET", url: `/rooms/${code}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        message: "OK",
        count: 1,
        total: 1,
        data: {
          name: defaultRoom.name,
          description: defaultRoom.description,
          code,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      }),
    );
  });
});
