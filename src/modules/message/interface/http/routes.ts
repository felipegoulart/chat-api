import type { FastifyInstance } from "fastify";
import status from "http-status";

export const messageHTTPRoutes = (app: FastifyInstance) => {
  app.addHook("onRequest", app.authenticate);

  app.route({
    method: "GET",
    url: "/",
    handler: (request, reply) => reply.status(status.OK),
  });
};
