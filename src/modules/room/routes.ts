import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod, ZodTypeProvider } from "fastify-type-provider-zod";
import { RoomController } from "./controller";

export const roomRoutes: FastifyPluginAsyncZod = async (fastify: FastifyInstance) => {
  const roomController = new RoomController();

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {},
    handler: roomController.listRooms.bind(roomController),
  });
};
