import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastify, { type FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import z from "zod/v4";
import { authPlugin } from "./modules/auth/auth-plugin.js";
import { authRoutes } from "./modules/auth/index.js";
import { roomRoutes } from "./modules/room/index.js";

export const createServer = (): FastifyInstance => {
  const app = fastify({
    logger: process.env.NODE_ENV !== "test" ? { level: "debug" } : false,
  }).withTypeProvider<ZodTypeProvider>();

  app.register(cors, {
    origin: "*",
  });
  app.register(cookies);
  app.register(websocket);
  app.register(authPlugin);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.get(
    "/",
    {
      schema: {
        response: {
          200: z.literal("The Pirate King I'll be!"),
        },
      },
    },
    () => {
      return "The Pirate King I'll be!" as const;
    },
  );

  app.get(
    "/health",
    {
      schema: {
        response: {
          200: z.literal("ok"),
        },
      },
    },
    () => {
      return "ok" as const;
    },
  );

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(422).send({
        error: "Response Validation Error",
        message: "Request doesn't match the schema",
        statusCode: 422,
        details: {
          issues: error.validation,
          method: request.method,
          url: request.url,
        },
      });
    }

    if (isResponseSerializationError(error)) {
      return reply.code(500).send({
        error: "Internal Server Error",
        message: "Response doesn't match the schema",
        statusCode: 500,
        details: {
          issues: error.cause.issues,
          method: error.method,
          url: error.url,
        },
      });
    }
    request.log.error(error);
    reply.status(500).send({ error: "Internal server error" });
  });

  app.register(authRoutes, { prefix: "/auth" });
  app.register(roomRoutes, { prefix: "/rooms" });

  return app;
};
