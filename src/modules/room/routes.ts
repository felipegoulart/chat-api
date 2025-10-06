import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { RoomController } from "./controller.js";

export const roomRoutes: FastifyPluginAsyncZod = async (app: FastifyInstance) => {
  const roomController = new RoomController();

  app.addHook("onRequest", app.authenticate);

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
    wsHandler: roomController.handleConnection.bind(roomController),
    handler: roomController.getByCode.bind(roomController),
  });

  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: roomController.create.bind(roomController),
  });

  app.route({
    method: "POST",
    url: "/:code/join",
    schema: {},
    handler: roomController.join.bind(roomController),
  });

  app.route({
    method: "POST",
    url: "/:code/leave",
    schema: {},
    handler: roomController.leave.bind(roomController),
  });
};
