import type { FastifyInstance } from "fastify";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RawData } from "ws";
import { redis } from "../../src/infra/cache/redis";
import { Room } from "../../src/modules/room/model";
import { createServer } from "../../src/server";

describe("E2E -> Room", () => {
  let app: FastifyInstance;
  let adminId: string;
  const defaultRoom = { name: "Room 1", description: "This is room 1" };

  beforeAll(async () => {
    app = createServer();
    await app.ready();

    const createUser = await app.inject({
      method: "POST",
      url: "/users",
      payload: {
        username: "admin",
        email: "admin@test.com",
        password: "123@Test",
        confirm: "123@Test",
      },
    });

    const {
      data: { id },
    } = await createUser.json();
    adminId = id;
  });

  afterEach(async () => {
    await Room.deleteMany({});
    await redis.flushAll();
  });

  it("should create a room", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: {
        adminId: adminId,
        ...defaultRoom,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: {
        ...defaultRoom,
        id: expect.any(String),
        code: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should return a rooms list", async () => {
    await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId },
    });

    const response = await app.inject({ method: "GET", url: "/rooms" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "OK",
      count: 1,
      total: 1,
      data: expect.arrayContaining([
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
      payload: { ...defaultRoom, adminId },
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

  it("should connect to a room by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const ws = await app.injectWS(`/rooms/${code}`);
    let resolve: (value: unknown) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });

    ws.on("message", async (message: RawData) => {
      resolve(message.toString());
    });

    ws.send("Hi there!");

    expect(await promise).toBe("Hi there!");
  });
});
