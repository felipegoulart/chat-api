import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import status from "http-status";
import z from "zod";
import { authRoutes } from "./modules/auth/index.js";
import { chatChannelRoutes } from "./modules/chat-channel/index.js";
import { env } from "./shared/env.js";
import { authPlugin } from "./shared/plugins/auth.js";

export class HttpServer {
  private readonly app: FastifyInstance;

  public readonly defaultOptions: FastifyServerOptions = {
    logger: env.NODE_ENV !== "test" ? { level: "debug" } : false,
  };

  constructor(options?: FastifyServerOptions) {
    this.app = fastify({ ...this.defaultOptions, ...options }).withTypeProvider<ZodTypeProvider>();
  }

  public async createServer(): Promise<FastifyInstance> {
    await this.bootstrap();
    this.setServerRoutes();
    await this.setRoutes();

    return this.app;
  }

  private async registerPlugins() {
    this.app.register(cors, {
      origin: "*",
    });

    this.app.register(cookies);
    this.app.register(websocket);
    this.app.register(authPlugin);
  }

  private async bootstrap() {
    await this.registerPlugins();

    this.app.setValidatorCompiler(validatorCompiler);
    this.app.setSerializerCompiler(serializerCompiler);

    this.app.setErrorHandler(this.errorHandling.bind(this));
  }

  private setServerRoutes() {
    this.app.get(
      "/",
      {
        schema: {
          response: {
            200: z.literal("Welcome to Checkpoint!"),
          },
        },
      },
      () => {
        return "Welcome to Checkpoint!" as const;
      },
    );

    this.app.get(
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
  }

  private async setRoutes() {
    await this.app.register(authRoutes, { prefix: "/auth" });
    await this.app.register(chatChannelRoutes, { prefix: "/chat-channels" });
  }

  private errorHandling(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
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

    if (error.statusCode === 401) {
      return reply.status(status.UNAUTHORIZED).send({ error: status[401] });
    }

    if (error.statusCode === 403) {
      return reply.status(status.FORBIDDEN).send({ error: status[403] });
    }

    request.log.error(error);
    reply.status(500).send({ error: "Internal server error" });
  }
}
