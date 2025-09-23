import { randomUUID } from "node:crypto";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyReply, FastifyRequest } from "fastify";
import { status } from "http-status";
import z from "zod";
import { redis } from "@/infra/cache/redis.js";
import { toRoomResponse } from "./mappers.js";
import { Room } from "./model.js";

const searchRoomsQuerySchema = z.object({
  q: z.string().min(1).max(50).optional(),
});

export type SearchRoomsQuery = z.infer<typeof searchRoomsQuerySchema>;

export const createRoomBodySchema = z.object({
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
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const results = await Room.find().sort({ createdAt: -1 });

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
    const { name, description } = request.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const room = new Room({ name, description, code });

    await room.save();

    return reply.status(status.CREATED).send({
      message: status[201],
      count: 1,
      total: 1,
      data: toRoomResponse(room),
    });
  }

  async connect(socket: WebSocket, request: FastifyRequest<{ Params: { code: string } }>) {
    const { code } = request.params;

    socket.on("message", async (message: unknown) => {
      await redis.SADD(`chat:online:room_${code}`, randomUUID());
      console.log("Received message:", message?.toString());
      socket.send(`${message}`);
    });
  }
}
