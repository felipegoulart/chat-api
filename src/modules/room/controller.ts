import { randomUUID } from "node:crypto";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyReply, FastifyRequest } from "fastify";
import { status } from "http-status";
import { Types } from "mongoose";
import z from "zod";
import { redis } from "@/infra/cache/redis.js";
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

    socket.on("message", async (message: unknown) => {
      await redis.SADD(`chat:online:room_${code}`, randomUUID());
      console.log("Received message:", message?.toString());
      socket.send(`${message}`);
    });
  }
}
