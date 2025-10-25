import type { WebSocket } from "@fastify/websocket";
import type { FastifyReply, FastifyRequest } from "fastify";
import { status } from "http-status";
import { Types } from "mongoose";
import type { RawData } from "ws";
import z from "zod";
import { redis } from "@/shared/cache/redis.js";
import { SessionHandler } from "@/shared/session-handler.js";
import { UserModel } from "../identity/persistence/user-model.js";
import { Message } from "../message/model.js";
import { toChatServerResponse } from "./mappers.js";
import { ChatServer } from "./model.js";

const searchChatServersQuerySchema = z.object({
  q: z.string().min(1).max(50).optional(),
});

export type SearchChatServerQuery = z.infer<typeof searchChatServersQuerySchema>;

export const createChatServerBodySchema = z.object({
  adminId: z.string(),
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(255).optional(),
});

export type createChatServer = z.infer<typeof createChatServerBodySchema>;

export const createChatServerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  code: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatServerResponse = z.infer<typeof createChatServerResponseSchema>;

const sessionHandler = new SessionHandler();

export class ChatServerController {
  async list(request: FastifyRequest<{ Headers: { user: string } }>, reply: FastifyReply) {
    try {
      const results = await ChatServer.find({ members: request.headers.user }).sort({ createdAt: -1 });

      return reply.code(status.OK).send({
        count: results.length, // TODO: implement pagination
        data: results.map(toChatServerResponse),
        message: status[200],
        total: results.length,
      });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  }

  async getByCode(request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) {
    const { code } = request.params;

    const chatServer = await ChatServer.findOne({ code });

    if (!chatServer) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    return reply.status(status.OK).send({
      message: status[200],
      count: 1,
      total: 1,
      data: toChatServerResponse(chatServer),
    });
  }

  async create(request: FastifyRequest<{ Body: createChatServer }>, reply: FastifyReply) {
    const { name, description, adminId } = request.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const chatServer = new ChatServer({ name, description, code, adminId: adminId, members: [adminId] });

    await chatServer.save();

    await UserModel.updateOne({ _id: adminId }, { $push: { chatServers: chatServer._id } });

    return reply.status(status.CREATED).send({
      message: status[201],
      count: 1,
      total: 1,
      data: toChatServerResponse(chatServer),
    });
  }

  async join(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;

    const userId = new Types.ObjectId(user);

    const chatServer = await ChatServer.findOne({ code });
    if (!chatServer) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    if (chatServer.members.includes(userId)) {
      return reply.status(status.CONFLICT).send({ message: status[409] });
    }

    chatServer.members.push(userId);
    await chatServer.save();

    await UserModel.updateOne({ _id: userId }, { $push: { chatServers: chatServer._id } });

    return reply.status(status.OK).send({ message: `User ${userId.toString()} joined chatServer` });
  }

  async leave(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;
    const userId = new Types.ObjectId(user);

    const chatServer = await ChatServer.findOneAndUpdate({ code }, { $pull: { members: userId } });
    if (!chatServer) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    await UserModel.updateOne({ _id: userId }, { $pull: { chatServers: chatServer._id } });

    return reply.status(status.OK).send({ message: status[200] });
  }

  async handleConnection(
    socket: WebSocket,
    request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>,
  ) {
    const { code } = request.params;
    const { user } = request.headers;

    socket.on("message", async (message: RawData) => {
      const { type, payload } = JSON.parse(message.toString());

      switch (type) {
        case "connect_chatServer": {
          const session = sessionHandler.initSession({ userId: user, chatServer: code, socket });
          const sessionsChatServer = sessionHandler.getSessionsByChatServer(code);

          await redis.SADD(`chat:online:chatServer_${code}`, session.id);

          sessionsChatServer.forEach((session) => {
            if (session.userId === user) return;

            session.socket.send(
              JSON.stringify({
                type: "connect_chatServer",
                payload: { message: `User ${user} joined the chatServer` },
              }),
            );
          });

          const oldMessages = await redis.LRANGE(`chat:history:chatServer_${code}`, 0, -1);

          socket.send(
            JSON.stringify({
              type: "connect_chatServer",
              payload: {
                message: "Joined chatServer",
                data: oldMessages.map((message) => {
                  const { sender, content, createdAt } = JSON.parse(message);
                  return { sender, content, createdAt };
                }),
              },
            }),
          );

          break;
        }
        case "send_message": {
          const session = sessionHandler.getSessionsByUserId(user);
          const sessionsChatServer = sessionHandler.getSessionsByChatServer(code);
          const chatServer = await ChatServer.findOne({ code });

          if (!chatServer) {
            throw new Error("ChatServer not found");
          }

          if (!session) {
            throw new Error("User not found");
          }

          const message = new Message({
            content: payload.message,
            sender: user,
            chatServer: chatServer._id,
          });

          await message.save();

          const payloadMessage = { sender: user, content: message.content, createdAt: message.createdAt };

          sessionsChatServer.forEach((session) => {
            if (session.userId === user) return;

            session.socket.send(
              JSON.stringify({
                type: "send_message",
                payload: payloadMessage,
              }),
            );
          });

          const redisListName = `chat:history:chatServer_${code}`;

          await redis.LPUSH(redisListName, JSON.stringify(payloadMessage));

          if ((await redis.LLEN(redisListName)) >= 100) {
            await redis.LTRIM(redisListName, 0, 99);
          }

          socket.send(JSON.stringify({ type: "message_sended", payload: { messageId: message._id.toString() } }));
          break;
        }
        case "disconnect_chatServer": {
          const sessions = sessionHandler.getSessionsByChatServer(code);
          const sessionId = `${user}:${code}`;

          sessionHandler.removeSessionById(sessionId);
          sessions.forEach((session) => {
            session.socket.send(
              JSON.stringify({
                type: "disconnect_chatServer",
                payload: { message: `User ${user} left the chatServer` },
              }),
            );
          });
          await redis.SREM(`chat:online:chatServer_${code}`, sessionId);
          break;
        }
        default:
          throw new Error("Invalid message type");
      }
    });

    socket.on("close", async () => {
      const sessions = sessionHandler.getSessionsByChatServer(code);
      const sessionId = `${user}:${code}`;

      sessionHandler.removeSessionById(sessionId);
      sessions.forEach((session) => {
        session.socket.send(
          JSON.stringify({ type: "disconnect_chatServer", payload: { message: `User ${user} left the chatServer` } }),
        );
      });
      await redis.SREM(`chat:online:chatServer_${code}`, sessionId);
    });
  }
}
