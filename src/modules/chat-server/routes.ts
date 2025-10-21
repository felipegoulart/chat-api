import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ChatServerController } from "./controller.js";

export const chatServerRoutes: FastifyPluginAsyncZod = async (app: FastifyInstance) => {
  const chatServerController = new ChatServerController();

  app.addHook("onRequest", app.authenticate);

  app.route({
    method: "GET",
    url: "/",
    schema: {},
    handler: chatServerController.list.bind(chatServerController),
  });

  app.route({
    method: "GET",
    url: "/:code",
    schema: {},
    wsHandler: chatServerController.handleConnection.bind(chatServerController),
    handler: chatServerController.getByCode.bind(chatServerController),
  });

  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: chatServerController.create.bind(chatServerController),
  });

  app.route({
    method: "POST",
    url: "/:code/join",
    schema: {},
    handler: chatServerController.join.bind(chatServerController),
  });

  app.route({
    method: "POST",
    url: "/:code/leave",
    schema: {},
    handler: chatServerController.leave.bind(chatServerController),
  });
};
