import cookies from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import fastify, { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import status from "http-status";
import z from "zod";
import { env } from "./env.js";
import { WebSocketHandler } from "./infra/gateway/websocket-handler.js";
import { authRoutes } from "./modules/auth/index.js";
import { messagePlugin } from "./modules/message/index.js";
import { roomRoutes } from "./modules/room/index.js";
import { authPlugin } from "./shared/plugins/auth.js";
import { redisPlugin } from "./shared/plugins/redis.js";

let websocketGateway: WebSocketHandler;

export class HttpServer {
  private readonly app: FastifyInstance;

  constructor() {
    this.app = fastify({
      logger: env.NODE_ENV !== "test" ? { level: "debug" } : false,
    }).withTypeProvider<ZodTypeProvider>();
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

    await this.app.register(redisPlugin);
    await this.app.register(messagePlugin);
  }

  private async bootstrap() {
    await this.registerPlugins();

    websocketGateway = WebSocketHandler.getInstance(this.app);

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
    await this.app.register(
      (app: FastifyInstance) => {
        app.addHook("onRequest", app.authenticate);
        app.get("/connect", { websocket: true }, websocketGateway.connectionHandler.bind(websocketGateway));
      },
      { prefix: "ws" },
    );

    await this.app.register(authRoutes, { prefix: "/auth" });
    await this.app.register(roomRoutes, { prefix: "/rooms" });
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
