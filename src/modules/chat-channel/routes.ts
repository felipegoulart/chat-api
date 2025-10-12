import type { FastifyInstance } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { ChatChannelController } from "./controller.js";

export const chatChannelRoutes: FastifyPluginAsyncZod = async (app: FastifyInstance) => {
  const chatChannelController = new ChatChannelController();

  app.addHook("onRequest", app.authenticate);

  app.route({
    method: "GET",
    url: "/",
    schema: {},
    handler: chatChannelController.list.bind(chatChannelController),
  });

  app.route({
    method: "GET",
    url: "/:code",
    schema: {},
    handler: chatChannelController.getByCode.bind(chatChannelController),
  });

  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: chatChannelController.create.bind(chatChannelController),
  });

  app.route({
    method: "POST",
    url: "/:code/join",
    schema: {},
    handler: chatChannelController.join.bind(chatChannelController),
  });

  app.route({
    method: "POST",
    url: "/:code/leave",
    schema: {},
    handler: chatChannelController.leave.bind(chatChannelController),
  });
};
