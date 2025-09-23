import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { RoomController } from "./controller.js";

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
    wsHandler: roomController.connect.bind(roomController),
    handler: roomController.getByCode.bind(roomController),
  });

  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: roomController.create.bind(roomController),
  });
};
