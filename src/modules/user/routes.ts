import type { FastifyInstance } from "fastify";
import { createUserBodySchema, UserController } from "./controller.js";

const userController = new UserController();

export const userRoutes = async (app: FastifyInstance) => {
  app.route({
    method: "POST",
    url: "/",
    schema: {
      body: createUserBodySchema,
    },
    handler: userController.create.bind(userController),
  });
};
