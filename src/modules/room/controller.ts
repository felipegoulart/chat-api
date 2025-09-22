import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { Room } from "./model";

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

export class RoomController {
  listRooms(request: FastifyRequest<{ Querystring: SearchRoomsQuery }>, reply: FastifyReply) {
    return {
      results: [
        {
          id: "room-id",
          name: "room-name",
          description: "room-description",
          code: "room-code",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };
  }

  async createRoom(request: FastifyRequest<{ Body: createRoom }>, reply: FastifyReply) {
    const { name, description } = request.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const room = await Room.create({ name, description, code });

    return reply.status(201).send({
      id: room._id,
      name: room.name,
      description: room.description,
      code: room.code,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    });
  }
}
