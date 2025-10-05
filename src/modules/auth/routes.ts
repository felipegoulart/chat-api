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
