import type { WebSocket } from "@fastify/websocket";
import type { FastifyReply, FastifyRequest } from "fastify";
import { status } from "http-status";
import { Types } from "mongoose";
import type { RawData } from "ws";
import z from "zod";
import { SessionHandler } from "@/shared/session-handler.js";
import { Message } from "../message/model.js";
import { User } from "../user/model.js";
import { toRoomResponse } from "./mappers.js";
import { Room } from "./model.js";

const searchRoomsQuerySchema = z.object({
  q: z.string().min(1).max(50).optional(),
});

export type SearchRoomsQuery = z.infer<typeof searchRoomsQuerySchema>;

export const createRoomBodySchema = z.object({
  adminId: z.string(),
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(255).optional(),
});

export type createRoom = z.infer<typeof createRoomBodySchema>;

export const createRoomResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  code: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoomResponse = z.infer<typeof createRoomResponseSchema>;

const sessionHandler = new SessionHandler();

export class RoomController {
  async list(request: FastifyRequest<{ Headers: { user: string } }>, reply: FastifyReply) {
    try {
      const results = await Room.find({ members: request.headers.user }).sort({ createdAt: -1 });

      return reply.code(status.OK).send({
        count: results.length, // TODO: implement pagination
        data: results.map(toRoomResponse),
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

    const room = await Room.findOne({ code });

    if (!room) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    return reply.status(status.OK).send({
      message: status[200],
      count: 1,
      total: 1,
      data: toRoomResponse(room),
    });
  }

  async create(request: FastifyRequest<{ Body: createRoom }>, reply: FastifyReply) {
    const { name, description, adminId } = request.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const room = new Room({ name, description, code, adminId: adminId, members: [adminId] });

    await room.save();

    await User.updateOne({ _id: adminId }, { $push: { rooms: room._id } });

    return reply.status(status.CREATED).send({
      message: status[201],
      count: 1,
      total: 1,
      data: toRoomResponse(room),
    });
  }

  async join(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;

    const userId = new Types.ObjectId(user);

    const room = await Room.findOne({ code });
    if (!room) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    if (room.members.includes(userId)) {
      return reply.status(status.CONFLICT).send({ message: status[409] });
    }

    room.members.push(userId);
    await room.save();

    await User.updateOne({ _id: userId }, { $push: { rooms: room._id } });

    return reply.status(status.OK).send({ message: `User ${userId.toString()} joined room` });
  }

  async leave(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;
    const userId = new Types.ObjectId(user);

    const room = await Room.findOneAndUpdate({ code }, { $pull: { members: userId } });
    if (!room) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    await User.updateOne({ _id: userId }, { $pull: { rooms: room._id } });

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
        case "connect_room": {
          const session = sessionHandler.initSession({ userId: user, room: code, socket });
          const sessionsRoom = sessionHandler.getSessionsByRoom(code);

          await request.redisCache.SADD(`chat:online:room_${code}`, session.id);

          sessionsRoom.forEach((session) => {
            if (session.userId === user) return;

            session.socket.send(
              JSON.stringify({ type: "connect_room", payload: { message: `User ${user} joined the room` } }),
            );
          });

          const oldMessages = await request.redisCache.LRANGE(`chat:history:room_${code}`, 0, -1);

          socket.send(
            JSON.stringify({
              type: "connect_room",
              payload: {
                message: "Joined room",
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
          const sessionsRoom = sessionHandler.getSessionsByRoom(code);
          const room = await Room.findOne({ code });

          if (!room) {
            throw new Error("Room not found");
          }

          if (!session) {
            throw new Error("User not found");
          }

          const message = new Message({
            content: payload.message,
            sender: user,
            room: room._id,
          });

          await message.save();

          const payloadMessage = { sender: user, content: message.content, createdAt: message.createdAt };

          sessionsRoom.forEach((session) => {
            if (session.userId === user) return;

            session.socket.send(
              JSON.stringify({
                type: "send_message",
                payload: payloadMessage,
              }),
            );
          });

          const redisListName = `chat:history:room_${code}`;

          await request.redisCache.LPUSH(redisListName, JSON.stringify(payloadMessage));

          if ((await request.redisCache.LLEN(redisListName)) >= 100) {
            await request.redisCache.LTRIM(redisListName, 0, 99);
          }

          socket.send(JSON.stringify({ type: "message_sended", payload: { messageId: message._id.toString() } }));
          break;
        }
        case "disconnect_room": {
          const sessions = sessionHandler.getSessionsByRoom(code);
          const sessionId = `${user}:${code}`;

          sessionHandler.removeSessionById(sessionId);
          sessions.forEach((session) => {
            session.socket.send(
              JSON.stringify({ type: "disconnect_room", payload: { message: `User ${user} left the room` } }),
            );
          });
          await request.redisCache.SREM(`chat:online:room_${code}`, sessionId);
          break;
        }
        default:
          throw new Error("Invalid message type");
      }
    });

    socket.on("close", async () => {
      const sessions = sessionHandler.getSessionsByRoom(code);
      const sessionId = `${user}:${code}`;

      sessionHandler.removeSessionById(sessionId);
      sessions.forEach((session) => {
        session.socket.send(
          JSON.stringify({ type: "disconnect_room", payload: { message: `User ${user} left the room` } }),
        );
      });
      await request.redisCache.SREM(`chat:online:room_${code}`, sessionId);
    });
  }
}
