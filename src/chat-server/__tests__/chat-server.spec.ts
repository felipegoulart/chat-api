import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MessageEvent, RawData } from "ws";
import { UserModel } from "@/identity/infrastructure/user-model.js";
import { redis } from "@/shared/cache/redis.js";
import { HttpServer } from "../../server.js";
import { ChatServer } from "../model.js";

describe.skip("E2E -> ChatServer", () => {
  const server = new HttpServer();
  let app: FastifyInstance;

  const userOne = new UserModel({
    nickname: "UserOne",
    email: "userone@test.com",
    password: "123@Test",
  });
  const userTwo = new UserModel({
    nickname: "UserTwo",
    email: "usertwo@test.com",
    password: "123@Test",
  });
  let userOneId: string;
  let userTwoId: string;

  const defaultChatServer = { name: "ChatServer 1", description: "This is room 1" };

  beforeAll(async () => {
    app = await server.createServer();

    await userOne.save();
    await userTwo.save();
    userOneId = userOne._id.toString();
    userTwoId = userTwo._id.toString();
  });

  afterEach(async () => {
    await ChatServer.deleteMany();
    await redis.flushAll();
  });

  afterAll(async () => {
    await app.close();
    UserModel.deleteMany();
  });

  it("should create a room", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: {
        adminId: userOne._id.toString(),
        ...defaultChatServer,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: {
        ...defaultChatServer,
        id: expect.any(String),
        code: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should allow an user to create a many rooms", async () => {
    const firstChatServerResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: {
        adminId: userOneId,
        ...defaultChatServer,
      },
    });

    expect(firstChatServerResponse.statusCode).toBe(201);
    expect(firstChatServerResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "ChatServer 1",
        description: "This is room 1",
      }),
    });

    const secondChatServerResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: {
        adminId: userOneId,
        name: "ChatServer 2",
        description: "This is room 2",
      },
    });

    expect(secondChatServerResponse.statusCode).toBe(201);
    expect(secondChatServerResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "ChatServer 2",
        description: "This is room 2",
      }),
    });
  });

  it("should return a rooms list user is member of", async () => {
    const createChatServerResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userTwoId },
    });

    const {
      data: { id: roomId },
    } = await createChatServerResponse.json();

    // TODO: create membership and test only rooms user is member of
    const response = await app.inject({ method: "GET", url: "/chat-servers", headers: { user: userOneId } });

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
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({ method: "GET", url: `/chat-servers/${code}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        message: "OK",
        count: 1,
        total: 1,
        data: {
          name: defaultChatServer.name,
          description: defaultChatServer.description,
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
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/join`,
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
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/join`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Conflict",
    });
  });

  it("should return 404 when try to join into room that does not exist", async () => {
    const response = await app.inject({ method: "POST", url: `/chat-servers/NOTEXIST/join` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Not Found",
    });
  });

  it("should allow an user to leave a room by code", async () => {
    const createChatServerResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createChatServerResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/leave`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "OK",
    });
  });

  it.skip("should connect to a room by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const ws = await app.injectWS(`/chat-servers/${code}`);
    let resolve: (value: unknown) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });

    ws.on("message", async (message: RawData) => {
      resolve(JSON.parse(message.toString()));
    });

    ws.send(JSON.stringify({ type: "connect_room", payload: {} }));

    expect(await promise).toStrictEqual({ type: "connect_room", payload: { message: "Joined room", data: [] } });
  });

  it.skip("should send a message to others users in a room when a new user joins", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const firstUserWS = await app.injectWS(`/chat-servers/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/chat-servers/${code}`, { headers: { user: userTwoId } });

    const firstUserJoinChatServerMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    firstUserWS.send(JSON.stringify({ type: "connect_room", payload: { data: [] } }));

    expect(await firstUserJoinChatServerMessagePromise).toStrictEqual({
      type: "connect_room",
      payload: { message: "Joined room", data: [] },
    });

    const secondUserJoinChatServerMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    const firstUserReceivedMessageOnSecondUserJoinChatServerPromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    secondUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));

    expect(await secondUserJoinChatServerMessagePromise).toStrictEqual({
      type: "connect_room",
      payload: { message: "Joined room", data: [] },
    });
    expect(await firstUserReceivedMessageOnSecondUserJoinChatServerPromise).toStrictEqual({
      type: "connect_room",
      payload: { message: `User ${userTwoId} joined the room` },
    });
  });

  it.skip("should send a message to others users in a room when a new message is sent", async () => {
    const createChatServerResponse = await app.inject({
      method: "POST",
      url: "/chat-servers",
      payload: { ...defaultChatServer, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createChatServerResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-servers/${code}/join`,
      headers: { user: userTwoId },
    });

    const firstUserWS = await app.injectWS(`/chat-servers/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/chat-servers/${code}`, { headers: { user: userTwoId } });

    firstUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));
    secondUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));

    const firstUserJoinChatServerMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });
    const secondUserJoinChatServerMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    // It's necessary to be await user join messages
    expect(await firstUserJoinChatServerMessagePromise).toBeTruthy();
    expect(await secondUserJoinChatServerMessagePromise).toBeTruthy();

    firstUserWS.send(JSON.stringify({ type: "send_message", payload: { message: "Hi there!" } }));

    const firstUserSendMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    const secondUserReceivedMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    expect(await secondUserReceivedMessagePromise).toStrictEqual({
      type: "send_message",
      payload: {
        sender: userOneId,
        content: "Hi there!",
        createdAt: expect.any(String),
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
