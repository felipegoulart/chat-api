import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { MessageEvent, RawData } from "ws";
import { redis } from "../../src/infra/cache/redis";
import { ChatChannelModel } from "../../src/modules/chat-channel/model";
import { User } from "../../src/modules/user";
import { HttpServer } from "../../src/server";

const server = new HttpServer();

describe("E2E -> Chat Channel", () => {
  let app: FastifyInstance;

  const userOne = new User({
    nickname: "UserOne",
    email: "userone@test.com",
    password: "123@Test",
  });
  const userTwo = new User({
    nickname: "UserTwo",
    email: "usertwo@test.com",
    password: "123@Test",
  });
  let userOneId: string;
  let userTwoId: string;

  const defaultChatChannel = { name: "ChatChannel 1", description: "This is channel 1" };

  beforeAll(async () => {
    app = await server.createServer();

    await userOne.save();
    await userTwo.save();
    userOneId = userOne._id.toString();
    userTwoId = userTwo._id.toString();
  });

  afterEach(async () => {
    await ChatChannelModel.deleteMany();
    await redis.flushAll();
  });

  afterAll(async () => {
    await app.close();
    User.deleteMany();
  });

  it("should create a channel", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: {
        adminId: userOne._id.toString(),
        ...defaultChatChannel,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: {
        ...defaultChatChannel,
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
      url: "/chat-channels",
      payload: {
        adminId: userOneId,
        ...defaultChatChannel,
      },
    });

    expect(firstRoomResponse.statusCode).toBe(201);
    expect(firstRoomResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "Chat Channel 1",
        description: "This is channel 1",
      }),
    });

    const secondRoomResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: {
        adminId: userOneId,
        name: "Chat Channel 2",
        description: "This is channel 2",
      },
    });

    expect(secondRoomResponse.statusCode).toBe(201);
    expect(secondRoomResponse.json()).toEqual({
      message: "Created",
      count: 1,
      total: 1,
      data: expect.objectContaining({
        name: "Chat Channel 2",
        description: "This is channel 2",
      }),
    });
  });

  it("should return a rooms list user is member of", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userTwoId },
    });

    const {
      data: { id: roomId },
    } = await createRoomResponse.json();

    // TODO: create membership and test only rooms user is member of
    const response = await app.inject({ method: "GET", url: "/chat-channels", headers: { user: userOneId } });

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

  it("should return a channel by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({ method: "GET", url: `/chat-channels/${code}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        message: "OK",
        count: 1,
        total: 1,
        data: {
          name: defaultChatChannel.name,
          description: defaultChatChannel.description,
          code,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      }),
    );
  });

  it("should allow an user to join a channel by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const response = await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/join`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: `User ${userTwoId} joined channel`,
    });
  });

  it("should not allow an user to join a channel twice", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/join`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Conflict",
    });
  });

  it("should return 404 when try to join into channel that does not exist", async () => {
    const response = await app.inject({ method: "POST", url: `/channel/NOT_EXIST/join` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: "Not Found",
    });
  });

  it("should allow an user to leave a channel by code", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createRoomResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/join`,
      headers: { user: userTwoId },
    });

    const response = await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/leave`,
      headers: { user: userTwoId },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      message: "OK",
    });
  });

  it("should connect to a channel by code", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const ws = await app.injectWS(`/chat-channels/${code}`);
    let resolve: (value: unknown) => void;
    const promise = new Promise((r) => {
      resolve = r;
    });

    ws.on("message", async (message: RawData) => {
      resolve(JSON.parse(message.toString()));
    });

    ws.send(JSON.stringify({ type: "connect_room", payload: {} }));

    expect(await promise).toStrictEqual({ type: "connect_room", payload: { message: "Joined channel", data: [] } });
  });

  it("should send a message to others users in a channel when a new user joins", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createResponse.json();

    const firstUserWS = await app.injectWS(`/chat-channels/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/chat-channels/${code}`, { headers: { user: userTwoId } });

    const firstUserJoinRoomMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    firstUserWS.send(JSON.stringify({ type: "connect_room", payload: { data: [] } }));

    expect(await firstUserJoinRoomMessagePromise).toStrictEqual({
      type: "connect_room",
      payload: { message: "Joined channel", data: [] },
    });

    const secondUserJoinRoomMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    const firstUserReceivedMessageOnSecondUserJoinRoomPromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    secondUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));

    expect(await secondUserJoinRoomMessagePromise).toStrictEqual({
      type: "connect_room",
      payload: { message: "Joined channel", data: [] },
    });
    expect(await firstUserReceivedMessageOnSecondUserJoinRoomPromise).toStrictEqual({
      type: "connect_room",
      payload: { message: `User ${userTwoId} joined the channel` },
    });
  });

  it("should send a message to others users in a channel when a new message is sent", async () => {
    const createRoomResponse = await app.inject({
      method: "POST",
      url: "/chat-channels",
      payload: { ...defaultChatChannel, adminId: userOneId },
    });

    const {
      data: { code },
    } = await createRoomResponse.json();

    await app.inject({
      method: "POST",
      url: `/chat-channels/${code}/join`,
      headers: { user: userTwoId },
    });

    const firstUserWS = await app.injectWS(`/chat-channels/${code}`, { headers: { user: userOneId } });
    const secondUserWS = await app.injectWS(`/chat-channels/${code}`, { headers: { user: userTwoId } });

    firstUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));
    secondUserWS.send(JSON.stringify({ type: "connect_room", payload: {} }));

    const firstUserJoinRoomMessagePromise = new Promise((resolve) => {
      firstUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });
    const secondUserJoinRoomMessagePromise = new Promise((resolve) => {
      secondUserWS.onmessage = (event: MessageEvent) => resolve(JSON.parse(event.data.toString()));
    });

    // It's necessary to be await user join messages
    expect(await firstUserJoinRoomMessagePromise).toBeTruthy();
    expect(await secondUserJoinRoomMessagePromise).toBeTruthy();

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
