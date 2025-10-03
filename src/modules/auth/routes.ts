import type { FastifyInstance } from "fastify";
import { AuthController } from "./controller.js";

const authController = new AuthController();

export const authRoutes = (app: FastifyInstance) => {
  app.route({
    method: "POST",
    url: "/register",
    handler: authController.register.bind(authController),
  });
};
