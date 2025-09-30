import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MessageEvent, RawData } from "ws";
import { redis } from "../../src/infra/cache/redis";
import { Room } from "../../src/modules/room/model";
import { User } from "../../src/modules/user";
import { createServer } from "../../src/server";

describe("E2E -> Room", () => {
  let app: FastifyInstance;

  const userOne = new User({
    username: "UserOne",
    email: "userone@test.com",
    password: "123@Test",
  });
  const userTwo = new User({
    username: "UserTwo",
    email: "usertwo@test.com",
    password: "123@Test",
  });
  let userOneId: string;
  let userTwoId: string;

  const defaultRoom = { name: "Room 1", description: "This is room 1" };

  beforeAll(async () => {
    app = createServer();
    await app.ready();

    await userOne.save();
    await userTwo.save();
    userOneId = userOne._id.toString();
    userTwoId = userTwo._id.toString();
  });

  afterEach(async () => {
    await Room.deleteMany();
    await redis.flushAll();
  });

  afterAll(async () => {
    await app.close();
    User.deleteMany();
  });

  it("should create a room", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: {
        adminId: userOne._id.toString(),
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

  it("should allow an user to create a many rooms", async () => {
    const firstRoomResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: {
        adminId: userOneId,
        ...defaultRoom,
      },
    });

    expect(firstRoomResponse.statusCode).toBe(201);
    expect(firstRoomResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "Room 1",
        description: "This is room 1",
      }),
    });

    const secondRoomResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: {
        adminId: userOneId,
        name: "Room 2",
        description: "This is room 2",
      },
    });

    expect(secondRoomResponse.statusCode).toBe(201);
    expect(secondRoomResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "Room 2",
        description: "This is room 2",
      }),
    });
  });

  it("should return a rooms list user is member of", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userTwoId },
    });

    const {
      data: { id: roomId },
    } = await createRoomResponse.json();

    // TODO: create membership and test only rooms user is member of
    const response = await app.inject({ method: "GET", url: "/rooms", headers: { user: userOneId } });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "OK",
      count: 1,
      total: 1,
      data: expect.arrayContaining([
        {
          id: roomId,
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
      payload: { ...defaultRoom, adminId: userOneId },
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

  it("should allow an user to join a room by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: `User ${userTwoId} joined room`,
    });
  });

  it("should not allow an user to join a room twice", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Conflict",
    });
  });

  it("should return 404 when try to join into room that does not exist", async () => {
    const response = await app.inject({ method: "POST", url: `/rooms/NOTEXIST/join` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Not Found",
    });
  });

  it("should allow an user to leave a room by code", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createRoomResponse.json();

    await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/rooms/${code}/leave`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "OK",
    });
  });

  it("should connect to a room by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
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
      resolve(JSON.parse(message.toString()));
    });

    ws.send(JSON.stringify({ type: "join", payload: {} }));

    expect(await promise).toStrictEqual({ type: "join", payload: { message: "Joined room" } });
  });

  it("should send a message to others users in a room when a new user joins", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const firstUserWS = await app.injectWS(`/rooms/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/rooms/${code}`, { headers: { user: userTwoId } });

    const firstUserJoinRoomMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    firstUserWS.send(JSON.stringify({ type: "join", payload: {} }));

    expect(await firstUserJoinRoomMessagePromise).toStrictEqual({ type: "join", payload: { message: "Joined room" } });

    const secondUserJoinRoomMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    const firstUserReceivedMessageOnSecondUserJoinRoomPromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    secondUserWS.send(JSON.stringify({ type: "join", payload: {} }));

    expect(await secondUserJoinRoomMessagePromise).toStrictEqual({ type: "join", payload: { message: "Joined room" } });
    expect(await firstUserReceivedMessageOnSecondUserJoinRoomPromise).toStrictEqual({
      type: "join",
      payload: { message: `User ${userTwoId} joined the room` },
    });
  });

  it("should send a message to others users in a room when a new message is sent", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/rooms",
      payload: { ...defaultRoom, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createRoomResponse.json();

    await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { user: userTwoId },
    });

    const firstUserWS = await app.injectWS(`/rooms/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/rooms/${code}`, { headers: { user: userTwoId } });

    firstUserWS.send(JSON.stringify({ type: "join", payload: {} }));
    secondUserWS.send(JSON.stringify({ type: "join", payload: {} }));

    const firstUserJoinRoomMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });
    const secondUserJoinRoomMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    // It's necessary to be await user join messages
    expect(await firstUserJoinRoomMessagePromise).toBeTruthy();
    expect(await secondUserJoinRoomMessagePromise).toBeTruthy();

    firstUserWS.send(JSON.stringify({ type: "message", payload: { message: "Hi there!" } }));

    const firstUserSendMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    const secondUserReceivedMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    expect(await secondUserReceivedMessagePromise).toStrictEqual({
      type: "message",
      payload: {
        sender: userOneId,
        message: "Hi there!",
      },
    });

    expect(await firstUserSendMessagePromise).toStrictEqual({
      type: "message_sended",
      payload: {
        messageId: expect.any(String),
      },
    });
  });
});
