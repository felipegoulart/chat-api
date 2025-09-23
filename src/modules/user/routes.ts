import type { FastifyInstance } from "fastify";
import { UserController } from "./controller.js";

const userController = new UserController();

export const userRoutes = async (app: FastifyInstance) => {
  app.route({
    method: "POST",
    url: "/",
    schema: {},
    handler: userController.create.bind(userController),
  });
};
