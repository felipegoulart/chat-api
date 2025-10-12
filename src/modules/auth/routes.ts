import type { FastifyInstance } from "fastify";
import z from "zod";
import { env } from "@/shared/env.js";
import { redis } from "@/shared/infra/redis/index.js";
import { MailSender } from "@/shared/mail-sender.js";
import { AuthController, createUserBodySchema } from "./controller.js";

const mailer = new MailSender({
  email: env.APP_EMAIL_ADDRESS,
  name: "Checkpoint App",
});
const authController = new AuthController(redis, mailer);

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
