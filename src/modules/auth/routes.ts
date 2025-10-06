import type { FastifyInstance } from "fastify";
import z from "zod";
import { AuthController, createUserBodySchema } from "./controller.js";

const authController = new AuthController();

export const authRoutes = (app: FastifyInstance) => {
  app.route({
    method: "POST",
    url: "/register",
    schema: {
      body: createUserBodySchema,
    },
    handler: authController.register.bind(authController),
  });

  app.route({
    method: "POST",
    url: "/login",
    schema: {
      body: z.object({
        email: z.email(),
        password: z.string(),
      }),
    },
    handler: authController.login.bind(authController),
  });

  app.route({
    method: "POST",
    url: "/logout",
    onRequest: [app.authenticate],
    handler: authController.logout.bind(authController),
  });

  app.route({
    method: "POST",
    url: "/refresh",
    handler: authController.refresh.bind(authController),
  });

  app.route({
    method: "GET",
    url: "/verify",
    schema: {
      querystring: z.object({
        token: z.string(),
      }),
    },
    handler: authController.verify.bind(authController),
  });
};
