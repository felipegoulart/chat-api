import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod, ZodTypeProvider } from "fastify-type-provider-zod";
import { RoomController } from "./controller";

export const roomRoutes: FastifyPluginAsyncZod = async (app: FastifyInstance) => {
  const roomController = new RoomController();

  app.route({
    method: "GET",
    url: "/",
    schema: {},
    handler: roomController.list.bind(roomController),
  });

  app.route({
    method: "GET",
    url: "/:code",
    schema: {},
    handler: roomController.getByCode.bind(roomController),
  });

  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: roomController.create.bind(roomController),
  });
};
