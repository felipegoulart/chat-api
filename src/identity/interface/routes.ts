import type { FastifyInstance } from "fastify";
import z from "zod";
import { apiErrorResponseFormatterReturnSchema } from "@/shared/errors/api-error.js";
import { AuthService } from "../domain/application/services/auth.service.js";
import { UserMongooseRepository } from "../persistence/mongoose.repository.js";
import { AuthController } from "./controller.js";

const userMongooseRepository = new UserMongooseRepository();
const authService = new AuthService(userMongooseRepository);
const authController = new AuthController(authService);

export const authRoutes = (app: FastifyInstance) => {
  app.route({
    method: "POST",
    url: "/register",
    schema: {
      response: {
        "4xx": apiErrorResponseFormatterReturnSchema,
        "500": apiErrorResponseFormatterReturnSchema,
      },
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
