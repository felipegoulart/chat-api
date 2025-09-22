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
}
