import type { FastifyReply, FastifyRequest } from "fastify";

export class RoomController {
  listRooms(request: FastifyRequest, reply: FastifyReply) {
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

  createRoom(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(201).send({
      id: "room-id",
      name: "room-name",
      description: "room-description",
      code: "room-code",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
