import type { FastifyInstance } from "fastify";
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
};
